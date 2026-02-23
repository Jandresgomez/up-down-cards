import { GameState, Card, Suit } from '../types/game-types';

export function isMyTurn(gameState: GameState, myPlayerId: string): boolean {
  if (gameState.status === 'betting' && gameState.currentRound) {
    const currentBettorId = gameState.currentRound.bettingOrder[
      gameState.currentRound.currentBettingIndex
    ];
    return currentBettorId === myPlayerId;
  }
  
  if (gameState.status === 'playing_hand' && gameState.currentRound?.currentHand) {
    const currentPlayerId = gameState.currentRound.currentHand.handOrder[
      gameState.currentRound.currentHand.currentPlayerIndex
    ];
    return currentPlayerId === myPlayerId;
  }
  
  return false;
}

export function getMyPlayer(gameState: GameState, myPlayerId: string) {
  return gameState.players.find(p => p.id === myPlayerId);
}

export function getMyHand(gameState: GameState, myPlayerId: string): Card[] {
  const player = getMyPlayer(gameState, myPlayerId);
  return player?.hand || [];
}

export function canPlayCard(gameState: GameState, myPlayerId: string, card: Card): boolean {
  const myHand = getMyHand(gameState, myPlayerId);
  
  // Check if card is in hand
  if (!myHand.some(c => c.suit === card.suit && c.rank === card.rank)) {
    return false;
  }
  
  const pinta = gameState.currentRound?.currentHand?.pinta;
  if (!pinta) return true; // First card, can play anything
  
  // Check if must follow pinta
  const hasPinta = myHand.some(c => c.suit === pinta);
  if (hasPinta && card.suit !== pinta) {
    return false; // Must follow pinta
  }
  
  return true;
}

export function getValidBets(gameState: GameState, myPlayerId: string): number[] {
  if (!gameState.currentRound) return [];
  
  const { cardsPerPlayer, bettingOrder, currentBettingIndex } = gameState.currentRound;
  const isLastPlayer = currentBettingIndex === bettingOrder.length - 1;
  
  const validBets: number[] = [];
  for (let i = 0; i <= cardsPerPlayer; i++) {
    validBets.push(i);
  }
  
  // Remove invalid bet for last player
  if (isLastPlayer) {
    const sumOfBets = gameState.players
      .filter(p => p.bet !== null)
      .reduce((sum, p) => sum + p.bet!, 0);
    const invalidBet = cardsPerPlayer - sumOfBets;
    return validBets.filter(b => b !== invalidBet);
  }
  
  return validBets;
}

export function getMesaSuit(gameState: GameState): Suit | null {
  return gameState.currentRound?.mesa.suit || null;
}

export function getPintaSuit(gameState: GameState): Suit | null {
  return gameState.currentRound?.currentHand?.pinta || null;
}

export function getCurrentBettor(gameState: GameState): string | null {
  if (gameState.status !== 'betting' || !gameState.currentRound) return null;
  return gameState.currentRound.bettingOrder[gameState.currentRound.currentBettingIndex];
}

export function getCurrentPlayer(gameState: GameState): string | null {
  if (gameState.status !== 'playing_hand' || !gameState.currentRound?.currentHand) return null;
  return gameState.currentRound.currentHand.handOrder[
    gameState.currentRound.currentHand.currentPlayerIndex
  ];
}
