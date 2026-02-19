import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Room, Player } from './types';

admin.initializeApp();
const db = admin.firestore();

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createRoom = functions.https.onCall(async (request) => {
  const { playerId } = request.data;
  
  if (!playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID is required');
  }

  const roomId = generateRoomId();
  const player: Player = {
    id: playerId,
    joinedAt: Date.now(),
    isAdmin: true
  };

  const room: Room = {
    id: roomId,
    adminId: playerId,
    createdAt: Date.now(),
    status: 'waiting',
    numberOfRounds: 1,
    maxPlayers: 4,
    players: [player],
    currentRound: 0
  };

  await db.collection('rooms').doc(roomId).set(room);

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

  const roomRef = db.collection('rooms').doc(roomId);
  
  try {
    await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const room = roomDoc.data() as Room;

      if (room.status !== 'waiting') {
        throw new Error('Room is not accepting players');
      }

      if (room.players.length >= room.maxPlayers) {
        throw new Error('Room is full');
      }

      // Check if player already in room
      if (room.players.some(p => p.id === playerId)) {
        return;
      }

      const player: Player = {
        id: playerId,
        joinedAt: Date.now(),
        isAdmin: false
      };

      transaction.update(roomRef, {
        players: [...room.players, player]
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

  const roomRef = db.collection('rooms').doc(roomId);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const room = roomDoc.data() as Room;

  if (room.adminId !== playerId) {
    return { success: false, error: 'Only admin can update settings' };
  }

  if (room.status !== 'waiting') {
    return { success: false, error: 'Cannot update settings after game started' };
  }

  const updates: Partial<Room> = {};
  if (numberOfRounds !== undefined) updates.numberOfRounds = numberOfRounds;
  if (maxPlayers !== undefined) updates.maxPlayers = maxPlayers;

  await roomRef.update(updates);

  return { success: true };
});

export const startGame = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID are required');
  }

  const roomRef = db.collection('rooms').doc(roomId);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const room = roomDoc.data() as Room;

  if (room.adminId !== playerId) {
    return { success: false, error: 'Only admin can start the game' };
  }

  if (room.status !== 'waiting') {
    return { success: false, error: 'Game already started' };
  }

  if (room.players.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' };
  }

  await roomRef.update({
    status: 'playing',
    currentRound: 1
  });

  return { success: true };
});
