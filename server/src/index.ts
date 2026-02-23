import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Room, Player } from './types';
import { GameState, PlayerState } from './game-types';

admin.initializeApp();
const db = admin.firestore();

// Export game functions
export { startGame as startGameV2, placeBet, playCard, continueGame } from './game-functions';

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createRoom = functions.https.onCall(async (request) => {
  const { playerId, numberOfRounds = 5 } = request.data;

  if (!playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID is required');
  }

  const roomId = generateRoomId();

  // Create player state
  const playerState: PlayerState = {
    id: playerId,
    hand: [],
    bet: null,
    handsWon: 0,
    totalScore: 0,
    naturalOrder: 1
  };

  // Create game state
  const gameState: GameState = {
    id: roomId,
    adminId: playerId,
    status: 'waiting',
    maxPlayers: 6,
    numberOfRounds,
    players: [playerState],
    playerOrder: [playerId],
    currentRound: null,
    roundSequence: [],
    completedRounds: [],
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null
  };

  // Store in games collection
  await db.collection('games').doc(roomId).set(gameState);

  // Also create player document
  await db.collection('players').doc(playerId).set({
    id: playerId,
    roomId,
    joinedAt: Date.now()
  });

  return { roomId, success: true };
});

export const joinRoom = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || typeof roomId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID is required');
  }

  if (!playerId || typeof playerId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID is required');
  }

  const gameRef = db.collection('games').doc(roomId);

  try {
    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new Error('Room not found');
      }

      const game = gameDoc.data() as GameState;

      // Check if player already in room (allow rejoining)
      if (game.players.some(p => p.id === playerId)) {
        return; // Already in room, allow reconnection
      }

      // Only allow new players to join if room is waiting
      if (game.status !== 'waiting') {
        throw new Error('Room is not accepting new players');
      }

      if (game.players.length >= game.maxPlayers) {
        throw new Error('Room is full');
      }

      const playerState: PlayerState = {
        id: playerId,
        hand: [],
        bet: null,
        handsWon: 0,
        totalScore: 0,
        naturalOrder: game.players.length + 1
      };

      transaction.update(gameRef, {
        players: [...game.players, playerState],
        playerOrder: [...game.playerOrder, playerId]
      });

      // Create player document
      transaction.set(db.collection('players').doc(playerId), {
        id: playerId,
        roomId,
        joinedAt: Date.now()
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const updateRoomSettings = functions.https.onCall(async (request) => {
  const { roomId, playerId, numberOfRounds, maxPlayers } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID are required');
  }

  const gameRef = db.collection('games').doc(roomId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const game = gameDoc.data() as GameState;

  if (game.adminId !== playerId) {
    return { success: false, error: 'Only admin can update settings' };
  }

  if (game.status !== 'waiting') {
    return { success: false, error: 'Cannot update settings after game started' };
  }

  const updates: Partial<GameState> = {};
  if (numberOfRounds !== undefined) {
    const maxPossible = Math.floor(51 / game.players.length);
    if (numberOfRounds > maxPossible) {
      return { success: false, error: `Number of rounds cannot exceed ${maxPossible} with ${game.players.length} players` };
    }
    updates.numberOfRounds = numberOfRounds;
  }
  if (maxPlayers !== undefined) updates.maxPlayers = maxPlayers;

  await gameRef.update(updates);

  return { success: true };
});

// Legacy startGame - kept for backward compatibility
export const startGame = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID are required');
  }

  const gameRef = db.collection('games').doc(roomId);

  return db.runTransaction(async (transaction) => {
    const gameDoc = await transaction.get(gameRef);

    if (!gameDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game not found');
    }

    let state = gameDoc.data() as GameState;

    try {
      const { GameStateMachine } = require('./state-machine');
      const action = { type: 'START_GAME', playerId };
      state = GameStateMachine.processAction(state, action);

      // Auto-transition to betting
      state = GameStateMachine.autoTransition(state);

      transaction.set(gameRef, JSON.parse(JSON.stringify(state)));

      return { success: true, status: state.status };
    } catch (error: any) {
      throw new functions.https.HttpsError('failed-precondition', error.message);
    }
  });
});

export const leaveRoom = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID are required');
  }

  const gameRef = db.collection('games').doc(roomId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const game = gameDoc.data() as GameState;

  // Can't leave if game has started
  if (game.status !== 'waiting') {
    return { success: false, error: 'Cannot leave after game has started' };
  }

  // Remove player
  const updatedPlayers = game.players.filter(p => p.id !== playerId);
  const updatedPlayerOrder = game.playerOrder.filter(id => id !== playerId);

  // If no players left or admin left, delete the room
  if (updatedPlayers.length === 0 || game.adminId === playerId) {
    await gameRef.delete();
    return { success: true, roomDeleted: true };
  }

  // Update room with remaining players
  await gameRef.update({
    players: updatedPlayers,
    playerOrder: updatedPlayerOrder
  });

  return { success: true, roomDeleted: false };
});

export const closeRoom = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID are required');
  }

  const gameRef = db.collection('games').doc(roomId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const game = gameDoc.data() as GameState;

  // Only admin can close room
  if (game.adminId !== playerId) {
    return { success: false, error: 'Only admin can close the room' };
  }

  // Delete the room
  await gameRef.delete();

  return { success: true };
});
