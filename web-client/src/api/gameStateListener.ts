import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { GameState } from '../types/game-types';

export function subscribeToGameState(
  roomId: string,
  onUpdate: (gameState: GameState) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const gameRef = doc(db, 'games', roomId);
  
  return onSnapshot(
    gameRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GameState;
        onUpdate(data);
      }
    },
    (error) => {
      console.error('Error listening to game state:', error);
      if (onError) onError(error);
    }
  );
}
