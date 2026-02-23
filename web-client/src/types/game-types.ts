export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 
  | 'waiting'
  | 'dealing'
  | 'betting'
  | 'playing_hand'
  | 'hand_complete'
  | 'round_complete'
  | 'game_complete';

export interface PlayerState {
  id: string;
  hand: Card[];
  bet: number | null;
  handsWon: number;
  totalScore: number;
  naturalOrder: number;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
  playOrder: number;
  timestamp: number;
}

export interface HandResult {
  handNumber: number;
  cardsPlayed: PlayedCard[];
  pinta: Suit;
  winnerId: string;
  winningCard: Card;
  timestamp: number;
}

export interface HandState {
  handNumber: number;
  cardsPlayed: PlayedCard[];
  pinta: Suit | null;
  currentPlayerIndex: number;
  handOrder: string[];
}

export interface RoundResult {
  roundNumber: number;
  roundIndex: number;
  cardsPerPlayer: number;
  mesa: Card;
  startingPlayerId: string;
  bets: { playerId: string; bet: number }[];
  hands: HandResult[];
  scores: { playerId: string; handsWon: number; points: number }[];
  timestamp: number;
}

export interface RoundState {
  roundNumber: number;
  roundIndex: number;
  cardsPerPlayer: number;
  mesa: Card;
  startingPlayerId: string;
  bettingOrder: string[];
  currentBettingIndex: number;
  handsPlayed: number;
  currentHand: HandState | null;
  completedHands: HandResult[];
}

export interface GameState {
  id: string;
  adminId: string;
  status: GameStatus;
  maxPlayers: number;
  numberOfRounds: number;
  players: PlayerState[];
  playerOrder: string[];
  currentRound: RoundState | null;
  roundSequence: number[];
  completedRounds: RoundResult[];
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

// Display helpers
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

export const SUIT_COLORS: Record<Suit, number> = {
  spades: 0x000000,
  hearts: 0xff0000,
  diamonds: 0xff0000,
  clubs: 0x000000
};
