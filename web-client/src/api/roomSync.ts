import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { GameState } from '../state/GameState';

export interface Player {
  id: string;
  joinedAt: number;
  isAdmin: boolean;
}

export interface RoomData {
  id: string;
  adminId: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  numberOfRounds: number;
  maxPlayers: number;
  players: Player[];
  currentRound: number;
}

export function subscribeToRoom(
  roomId: string,
  gameState: GameState,
  onUpdate: (room: RoomData) => void
): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomId);

  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.data() as RoomData;
      onUpdate(roomData);

      // Update game state based on room status
      if (roomData.status === 'playing' && gameState.getCurrentScreen() === 'waiting') {
        gameState.startGame();
      }
    }
  });
}
