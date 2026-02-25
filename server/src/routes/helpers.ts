import { db } from '../config/firebase';
import { GameState, PlayerAction } from '../models/game-types';
import { GameStateMachine } from '../models/state-machine';

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function handlePlayerAction(action: PlayerAction) {
  const { playerId } = action;

  if (!playerId) {
    throw new Error('Player ID required');
  }

  const playerDoc = await db.collection('players').doc(playerId).get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const roomId = playerDoc.data()!.roomId;
  const gameRef = db.collection('games').doc(roomId);

  return db.runTransaction(async (transaction) => {
    const gameDoc = await transaction.get(gameRef);

    if (!gameDoc.exists) {
      throw new Error('Game not found');
    }

    let state = gameDoc.data() as GameState;

    state = GameStateMachine.processAction(state, action);

    let previousStatus = state.status;
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      state = GameStateMachine.autoTransition(state);
      if (state.status === previousStatus) break;
      previousStatus = state.status;
      iterations++;
    }

    transaction.set(gameRef, JSON.parse(JSON.stringify(state)));

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
  });
}
