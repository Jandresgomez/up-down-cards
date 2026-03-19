import { GameState, GameStatus, Suit, Rank, HandState } from '../types/game-types';

export const MOCK_MY_PLAYER_ID = 'mock-player-1';

const ALL_MOCK_PLAYERS = [
  { id: 'mock-player-1', naturalOrder: 0 },
  { id: 'mock-player-2', naturalOrder: 1 },
  { id: 'mock-player-3', naturalOrder: 2 },
  { id: 'mock-player-4', naturalOrder: 3 },
  { id: 'mock-player-5', naturalOrder: 4 },
  { id: 'mock-player-6', naturalOrder: 5 },
  { id: 'mock-player-7', naturalOrder: 6 },
  { id: 'mock-player-8', naturalOrder: 7 },
  { id: 'mock-player-9', naturalOrder: 8 },
  { id: 'mock-player-10', naturalOrder: 9 },
];

export const MOCK_PLAYER_NAMES: Record<string, { name: string }> = {
  'mock-player-1': { name: 'Jandro' },
  'mock-player-2': { name: 'Maria' },
  'mock-player-3': { name: 'Sofia' },
  'mock-player-4': { name: 'Carlos' },
  'mock-player-5': { name: 'Lucia' },
  'mock-player-6': { name: 'Andres' },
  'mock-player-7': { name: 'Elena' },
  'mock-player-8': { name: 'Diego' },
  'mock-player-9': { name: 'Isabella' },
  'mock-player-10': { name: 'Mateo' },
};

export interface MockScenario {
  id: number;
  label: string;
  playerCount: number;
  cardsPerPlayer: number;
}

const SCENARIO_CONFIGS: [number, number][] = [
  [10, 10],
  [10, 5],
  [9, 5],
  [8, 6],
  [6, 8],
  [6, 1],
  [5, 10],
  [4, 5],
  [2, 25],
];

export const MOCK_SCENARIOS: MockScenario[] = SCENARIO_CONFIGS.map(([p, c], i) => ({
  id: i + 1,
  label: `${p}P, ${c}C`,
  playerCount: p,
  cardsPerPlayer: c,
}));

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

export function getMockGameState(phase: 'betting' | 'playing_hand' | 'round_complete', scenarioId: number = 1): GameState {
  const scenario = MOCK_SCENARIOS.find(s => s.id === scenarioId) ?? MOCK_SCENARIOS[0];
  const { playerCount, cardsPerPlayer } = scenario;
  const status: GameStatus = phase;

  const deck = buildDeck();
  const mockPlayers = ALL_MOCK_PLAYERS.slice(0, playerCount);
  const playerOrder = mockPlayers.map(p => p.id);

  // Build bets: for playing_hand/round_complete all placed; for betting only the first half
  const halfBetting = Math.floor(playerCount / 2);
  const players = mockPlayers.map((p, i) => {
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    const betValue = i % (cardsPerPlayer + 1); // spread bets across valid range

    if (phase === 'round_complete') {
      // Simulate finished round: some players deliver, some fail
      const bet = betValue;
      const delivered = i % 3 !== 2; // ~2/3 deliver
      const handsWon = delivered ? bet : Math.max(0, bet - 1);
      const points = delivered ? 10 + 2 * handsWon : 0;
      // Give varied totals so the leaderboard is interesting
      const priorScore = (playerCount - i) * 12 + (i % 2 === 0 ? 8 : 0);
      return {
        id: p.id,
        naturalOrder: p.naturalOrder,
        hand,
        bet,
        handsWon,
        totalScore: priorScore + points,
      };
    }

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
  const mesaCard = { suit: SUITS[0], rank: RANKS[0] };

  const currentHand: HandState | null = status === 'playing_hand' ? {
    handNumber: 2,
    cardsPlayed: players.map((p, pos) => ({
      playerId: p.id, card: {
        suit: SUITS[0],
        rank: RANKS[pos + 1]
      },
      playOrder: 0,
      timestamp: Date.now()
    })),
    pinta: SUITS[0],
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
      roundNumber: 3,
      roundIndex: 2,
      cardsPerPlayer,
      mesa: mesaCard,
      startingPlayerId: playerOrder[0],
      bettingOrder: playerOrder,
      currentBettingIndex: status === 'betting' ? halfBetting : playerCount,
      handsPlayed: phase === 'round_complete' ? cardsPerPlayer : (status === 'playing_hand' ? 1 : 0),
      currentHand,
      completedHands: [],
      ...(phase === 'round_complete' ? { playersReady: ['mock-player-3'] } : {}),
    },
  };
}
