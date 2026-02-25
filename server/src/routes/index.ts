import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { GameState, PlayerState, PlayerAction } from '../models/game-types';
import { GameStateMachine } from '../models/state-machine';
import { generateRoomId, handlePlayerAction } from './helpers';

const router = Router();

router.post('/createRoom', async (req: Request, res: Response) => {
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

router.post('/joinRoom', async (req: Request, res: Response) => {
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

router.post('/updateRoomSettings', async (req: Request, res: Response) => {
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

router.post('/startGame', async (req: Request, res: Response) => {
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

router.post('/placeBet', async (req: Request, res: Response) => {
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

router.post('/playCard', async (req: Request, res: Response) => {
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

router.post('/continueGame', async (req: Request, res: Response) => {
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

router.post('/leaveRoom', async (req: Request, res: Response) => {
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

router.post('/closeRoom', async (req: Request, res: Response) => {
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

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
