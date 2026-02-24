import express, { Request, Response } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { GameState, PlayerAction, PlayerState } from './game-types';
import { GameStateMachine } from './state-machine';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'up-down-cards',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to handle player actions
async function handlePlayerAction(action: PlayerAction) {
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

// Routes
app.post('/createRoom', async (req: Request, res: Response) => {
  try {
    const { playerId, numberOfRounds = 5 } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const roomId = generateRoomId();

    const playerState: PlayerState = {
      id: playerId,
      hand: [],
      bet: null,
      handsWon: 0,
      totalScore: 0,
      naturalOrder: 1
    };

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

    await db.collection('games').doc(roomId).set(gameState);
    await db.collection('players').doc(playerId).set({
      id: playerId,
      roomId,
      joinedAt: Date.now()
    });

    res.json({ roomId, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/joinRoom', async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.body;

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const gameRef = db.collection('games').doc(roomId);

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new Error('Room not found');
      }

      const game = gameDoc.data() as GameState;

      if (game.players.some(p => p.id === playerId)) {
        return;
      }

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

      transaction.set(db.collection('players').doc(playerId), {
        id: playerId,
        roomId,
        joinedAt: Date.now()
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/updateRoomSettings', async (req: Request, res: Response) => {
  try {
    const { roomId, playerId, numberOfRounds, maxPlayers } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'Room ID and Player ID are required' });
    }

    const gameRef = db.collection('games').doc(roomId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const game = gameDoc.data() as GameState;

    if (game.adminId !== playerId) {
      return res.status(403).json({ success: false, error: 'Only admin can update settings' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ success: false, error: 'Cannot update settings after game started' });
    }

    const updates: Partial<GameState> = {};
    if (numberOfRounds !== undefined) {
      const maxPossible = Math.floor(51 / game.players.length);
      if (numberOfRounds > maxPossible) {
        return res.status(400).json({ 
          success: false, 
          error: `Number of rounds cannot exceed ${maxPossible} with ${game.players.length} players` 
        });
      }
      updates.numberOfRounds = numberOfRounds;
    }
    if (maxPlayers !== undefined) updates.maxPlayers = maxPlayers;

    await gameRef.update(updates);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/startGame', async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'Room ID and Player ID are required' });
    }

    const gameRef = db.collection('games').doc(roomId);

    const result = await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new Error('Game not found');
      }

      let state = gameDoc.data() as GameState;

      const action: PlayerAction = { type: 'START_GAME', playerId };
      state = GameStateMachine.processAction(state, action);
      state = GameStateMachine.autoTransition(state);

      transaction.set(gameRef, JSON.parse(JSON.stringify(state)));

      return { success: true, status: state.status };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/placeBet', async (req: Request, res: Response) => {
  try {
    const { playerId, bet } = req.body;

    if (!playerId || bet === undefined) {
      return res.status(400).json({ error: 'Player ID and bet required' });
    }

    const action: PlayerAction = { type: 'PLACE_BET', playerId, bet };
    const result = await handlePlayerAction(action);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/playCard', async (req: Request, res: Response) => {
  try {
    const { playerId, card } = req.body;

    if (!playerId || !card) {
      return res.status(400).json({ error: 'Player ID and card required' });
    }

    const action: PlayerAction = { type: 'PLAY_CARD', playerId, card };
    const result = await handlePlayerAction(action);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/continueGame', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }

    const action: PlayerAction = { type: 'CONTINUE', playerId };
    const result = await handlePlayerAction(action);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/leaveRoom', async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'Room ID and Player ID are required' });
    }

    const gameRef = db.collection('games').doc(roomId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const game = gameDoc.data() as GameState;

    if (game.status !== 'waiting') {
      return res.status(400).json({ success: false, error: 'Cannot leave after game has started' });
    }

    const updatedPlayers = game.players.filter(p => p.id !== playerId);
    const updatedPlayerOrder = game.playerOrder.filter(id => id !== playerId);

    if (updatedPlayers.length === 0 || game.adminId === playerId) {
      await gameRef.delete();
      return res.json({ success: true, roomDeleted: true });
    }

    await gameRef.update({
      players: updatedPlayers,
      playerOrder: updatedPlayerOrder
    });

    res.json({ success: true, roomDeleted: false });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/closeRoom', async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'Room ID and Player ID are required' });
    }

    const gameRef = db.collection('games').doc(roomId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const game = gameDoc.data() as GameState;

    if (game.adminId !== playerId) {
      return res.status(403).json({ success: false, error: 'Only admin can close the room' });
    }

    await gameRef.delete();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;
