import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GameState, PlayerAction } from './game-types';
import { GameStateMachine } from './state-machine';

const db = admin.firestore();

async function handlePlayerAction(action: PlayerAction) {
  const { playerId } = action;
  
  if (!playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID required');
  }

  // Get game state from player's room
  const playerDoc = await db.collection('players').doc(playerId).get();
  if (!playerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Player not found');
  }

  const roomId = playerDoc.data()!.roomId;
  const gameRef = db.collection('games').doc(roomId);

  // Use transaction to ensure atomic state updates
  return db.runTransaction(async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    
    if (!gameDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game not found');
    }

    let state = gameDoc.data() as GameState;

    // Process the action
    try {
      state = GameStateMachine.processAction(state, action);
      
      // Auto-transition through states that don't need player input
      let previousStatus = state.status;
      let iterations = 0;
      const maxIterations = 10;
      
      while (iterations < maxIterations) {
        state = GameStateMachine.autoTransition(state);
        if (state.status === previousStatus) break;
        previousStatus = state.status;
        iterations++;
      }

      // Update game state
      transaction.update(gameRef, state as any);

      return {
        success: true,
        state: {
          status: state.status,
          currentRound: state.currentRound,
          players: state.players.map(p => ({
            id: p.id,
            bet: p.bet,
            handsWon: p.handsWon,
            totalScore: p.totalScore,
            handSize: p.hand.length
          }))
        }
      };
    } catch (error: any) {
      throw new functions.https.HttpsError('failed-precondition', error.message);
    }
  });
}

export const startGame = functions.https.onCall(async (request) => {
  const { roomId, playerId } = request.data;

  if (!roomId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID and Player ID required');
  }

  const gameRef = db.collection('games').doc(roomId);

  return db.runTransaction(async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    
    if (!gameDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game not found');
    }

    let state = gameDoc.data() as GameState;

    try {
      const action: PlayerAction = { type: 'START_GAME', playerId };
      state = GameStateMachine.processAction(state, action);
      
      // Auto-transition to betting
      state = GameStateMachine.autoTransition(state);

      transaction.update(gameRef, state as any);

      return { success: true, status: state.status };
    } catch (error: any) {
      throw new functions.https.HttpsError('failed-precondition', error.message);
    }
  });
});

export const placeBet = functions.https.onCall(async (request) => {
  const { playerId, bet } = request.data;

  if (!playerId || bet === undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID and bet required');
  }

  const action: PlayerAction = { type: 'PLACE_BET', playerId, bet };
  return handlePlayerAction(action);
});

export const playCard = functions.https.onCall(async (request) => {
  const { playerId, card } = request.data;

  if (!playerId || !card) {
    throw new functions.https.HttpsError('invalid-argument', 'Player ID and card required');
  }

  const action: PlayerAction = { type: 'PLAY_CARD', playerId, card };
  return handlePlayerAction(action);
});
