import { GameState, GameStatus, Suit, Rank } from '../types/game-types';

export const MOCK_MY_PLAYER_ID = 'mock-player-1';

const ALL_MOCK_PLAYERS = [
  { id: 'mock-player-1', naturalOrder: 0 },
  { id: 'mock-player-2', naturalOrder: 1 },
  { id: 'mock-player-3', naturalOrder: 2 },
  { id: 'mock-player-4', naturalOrder: 3 },
  { id: 'mock-player-5', naturalOrder: 4 },
  { id: 'mock-player-6', naturalOrder: 5 },
];

export const MOCK_PLAYER_NAMES: Record<string, { name: string }> = {
  'mock-player-1': { name: 'Jandro' },
  'mock-player-2': { name: 'Maria' },
  'mock-player-3': { name: 'Sofia' },
  'mock-player-4': { name: 'Carlos' },
  'mock-player-5': { name: 'Lucia' },
  'mock-player-6': { name: 'Andres' },
};

export interface MockScenario {
  id: number;
  label: string;
  playerCount: number;
  cardsPerPlayer: number;
}

export const MOCK_SCENARIOS: MockScenario[] = [
  { id: 1, label: '6 players, 8 cards', playerCount: 6, cardsPerPlayer: 8 },
  { id: 2, label: '5 players, 10 cards', playerCount: 5, cardsPerPlayer: 10 },
  { id: 3, label: '4 players, 5 cards', playerCount: 4, cardsPerPlayer: 5 },
  { id: 4, label: '6 players, 1 card', playerCount: 6, cardsPerPlayer: 1 },
];

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

function buildDeck(): { suit: Suit; rank: Rank }[] {
  const deck: { suit: Suit; rank: Rank }[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function getMockGameState(phase: 'betting' | 'playing_hand', scenarioId: number = 1): GameState {
  const scenario = MOCK_SCENARIOS.find(s => s.id === scenarioId) ?? MOCK_SCENARIOS[0];
  const { playerCount, cardsPerPlayer } = scenario;
  const status: GameStatus = phase;

  const deck = buildDeck();
  const mockPlayers = ALL_MOCK_PLAYERS.slice(0, playerCount);
  const playerOrder = mockPlayers.map(p => p.id);

  // Build bets: for playing_hand all placed; for betting only the first half placed
  const halfBetting = Math.floor(playerCount / 2);
  const players = mockPlayers.map((p, i) => {
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    const betValue = i % (cardsPerPlayer + 1); // spread bets across valid range
    const bet = status === 'playing_hand'
      ? betValue
      : (i < halfBetting ? betValue : null);
    return {
      id: p.id,
      naturalOrder: p.naturalOrder,
      hand,
      bet,
      handsWon: status === 'playing_hand' ? (i === 0 ? 1 : 0) : 0,
      totalScore: 0,
    };
  });

  // Mesa card is the first card after all hands
  const mesaCard = deck[playerCount * cardsPerPlayer];

  const currentHand = status === 'playing_hand' ? {
    handNumber: 2,
    cardsPlayed: [
      { playerId: playerOrder[1], card: { suit: 'spades' as const, rank: 'Q' as const }, playOrder: 0, timestamp: Date.now() },
      { playerId: playerOrder[2], card: { suit: 'spades' as const, rank: '8' as const }, playOrder: 1, timestamp: Date.now() },
    ],
    pinta: 'hearts' as const,
    currentPlayerIndex: 0,
    handOrder: playerOrder,
  } : null;

  const maxCards = Math.floor(51 / playerCount);
  const roundSequence: number[] = [];
  for (let i = 1; i <= maxCards; i++) roundSequence.push(i);
  for (let i = maxCards - 1; i >= 1; i--) roundSequence.push(i);

  return {
    id: 'mock-room',
    adminId: playerOrder[0],
    status,
    maxPlayers: playerCount,
    numberOfRounds: roundSequence.length,
    players,
    playerOrder,
    roundSequence,
    completedRounds: [],
    createdAt: Date.now(),
    startedAt: Date.now(),
    completedAt: null,
    currentRound: {
      roundNumber: 1,
      roundIndex: 0,
      cardsPerPlayer,
      mesa: mesaCard,
      startingPlayerId: playerOrder[0],
      bettingOrder: playerOrder,
      currentBettingIndex: status === 'betting' ? halfBetting : playerCount,
      handsPlayed: status === 'playing_hand' ? 1 : 0,
      currentHand,
      completedHands: [],
    },
  };
}
