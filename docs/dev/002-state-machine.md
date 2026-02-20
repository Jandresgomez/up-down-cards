# Game State Machine Implementation

## Overview

The Up-Down card game is implemented using a server-side state machine that ensures all game logic and state mutations happen on the server. Players send actions to the server, which validates and processes them, updating the game state accordingly.

## Architecture

### Core Components

1. **game-types.ts** - TypeScript interfaces for all game state and actions
2. **deck.ts** - Card deck utilities (creation, shuffling, card comparison)
3. **state-machine.ts** - State machine logic with transitions and validations
4. **game-functions.ts** - Cloud Functions that expose the state machine to clients

### Data Flow

```
Client → Cloud Function → State Machine → Firestore
                ↓
         Firestore Listener → Client (real-time updates)
```

## Game States

The game progresses through these states:

```
waiting          → Players join, admin configures settings
  ↓ START_GAME
dealing          → Server deals cards, draws mesa
  ↓ AUTO
betting          → Players place bets sequentially (PS1 → PSL)
  ↓ PLACE_BET (all players)
playing_hand     → Players play cards sequentially (PH1 → PHL)
  ↓ PLAY_CARD (all players)
hand_complete    → Server determines hand winner
  ↓ AUTO
  ├─→ playing_hand (if more hands in round)
  └─→ round_complete (if all hands played)
round_complete   → Server calculates scores
  ↓ AUTO
  ├─→ dealing (if more rounds)
  └─→ game_complete (if all rounds done)
game_complete    → Final scores, game over
```

### Auto-Transition States

These states automatically transition without player input:
- `dealing` → `betting`
- `hand_complete` → `playing_hand` or `round_complete`
- `round_complete` → `dealing` or `game_complete`

## Player Actions

### START_GAME
```typescript
{ type: 'START_GAME', playerId: string }
```
- **Preconditions**: 
  - Game status is `waiting`
  - Player is admin
  - At least 2 players
- **Effects**:
  - Generates round sequence [1,2,3...N...3,2,1]
  - Randomly selects starting player (PG1)
  - Transitions to `dealing`

### PLACE_BET
```typescript
{ type: 'PLACE_BET', playerId: string, bet: number }
```
- **Preconditions**:
  - Game status is `betting`
  - It's the player's turn to bet
  - Bet is valid (0 ≤ bet ≤ cardsPerPlayer)
  - Last player constraint: sum of bets ≠ cardsPerPlayer
- **Effects**:
  - Records player's bet
  - Advances to next player or transitions to `playing_hand`

### PLAY_CARD
```typescript
{ type: 'PLAY_CARD', playerId: string, card: Card }
```
- **Preconditions**:
  - Game status is `playing_hand`
  - It's the player's turn
  - Card is in player's hand
  - If pinta exists and player has pinta cards, must play pinta
- **Effects**:
  - Removes card from player's hand
  - Records played card
  - Sets pinta (first card's suit)
  - Advances to next player or transitions to `hand_complete`

## Game State Structure

### GameState (Root)
```typescript
{
  id: string                      // Room ID
  adminId: string                 // Admin player ID
  status: GameStatus              // Current state
  maxPlayers: number              // Max players allowed
  maxRoundSize: number            // N (max cards per round)
  players: PlayerState[]          // All players
  playerOrder: string[]           // Natural order [P1, P2, P3...]
  currentRound: RoundState | null // Current round in progress
  roundSequence: number[]         // [1,2,3...N...3,2,1]
  completedRounds: RoundResult[]  // History of finished rounds
  createdAt: number
  startedAt: number | null
  completedAt: number | null
}
```

### RoundState (Current Round)
```typescript
{
  roundNumber: number             // 1 to N (or N-1 to 1)
  roundIndex: number              // Index in roundSequence
  cardsPerPlayer: number          // X (cards this round)
  mesa: Card                      // Face-up card (highest suit)
  startingPlayerId: string        // PS1 for this round
  bettingOrder: string[]          // Player IDs in betting order
  currentBettingIndex: number     // Current bettor
  handsPlayed: number             // Completed hands count
  currentHand: HandState | null   // Hand in progress
  completedHands: HandResult[]    // Finished hands this round
}
```

### HandState (Current Hand)
```typescript
{
  handNumber: number              // 1 to X
  cardsPlayed: PlayedCard[]       // Cards played so far
  pinta: Suit | null              // First card's suit
  currentPlayerIndex: number      // Current player in handOrder
  handOrder: string[]             // Player IDs in play order
}
```

### History Records

**HandResult** - Immutable record of completed hand:
```typescript
{
  handNumber: number
  cardsPlayed: PlayedCard[]
  pinta: Suit
  winnerId: string
  winningCard: Card
  timestamp: number
}
```

**RoundResult** - Immutable record of completed round:
```typescript
{
  roundNumber: number
  roundIndex: number
  cardsPerPlayer: number
  mesa: Card
  startingPlayerId: string
  bets: { playerId: string; bet: number }[]
  hands: HandResult[]
  scores: { playerId: string; handsWon: number; points: number }[]
  timestamp: number
}
```

## Game Logic Rules

### Player Order

- **Natural Order (PGK)**: Fixed order for entire game (P1, P2, P3...)
- **Round Order (PSK)**: Rotates each round based on PG(roundIndex)
- **Hand Order (PHK)**: Winner of previous hand goes first (PS2 for first hand)

### Betting Rules

1. Players bet sequentially in round order (PS1 → PSL)
2. Each player sees previous bets
3. Last player (PSL) cannot make sum equal to cardsPerPlayer
4. Valid bet range: 0 ≤ bet ≤ cardsPerPlayer

### Card Play Rules

1. Players play sequentially in hand order (PH1 → PHL)
2. First card's suit becomes the pinta
3. Must follow pinta if possible
4. If no pinta cards, can play any card

### Card Ranking

Within a hand, cards are ranked:
1. **Mesa suit** (highest priority)
2. **Pinta suit** (second priority)
3. **Other suits** (lowest priority)

Within same suit: A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2

### Scoring

After each round:
- If bet ≠ handsWon: **0 points**
- If bet === handsWon: **10 + 2 × handsWon points**

## Cloud Functions API

### startGame
```typescript
// Start the game (admin only)
firebase.functions().httpsCallable('startGame')({
  roomId: string,
  playerId: string
})
```

### placeBet
```typescript
// Place a bet during betting phase
firebase.functions().httpsCallable('placeBet')({
  roomId: string,
  playerId: string,
  bet: number
})
```

### playCard
```typescript
// Play a card during hand
firebase.functions().httpsCallable('playCard')({
  roomId: string,
  playerId: string,
  card: { suit: Suit, rank: Rank }
})
```

## Client Integration

### Listening to Game State

```typescript
// Subscribe to game state changes
const unsubscribe = db.collection('games').doc(roomId)
  .onSnapshot((doc) => {
    const gameState = doc.data() as GameState;
    // Update UI based on gameState.status
    // Show current player's turn
    // Display cards, bets, scores, etc.
  });
```

### Determining Current Player

```typescript
function isMyTurn(gameState: GameState, myPlayerId: string): boolean {
  if (gameState.status === 'betting') {
    const currentBettorId = gameState.currentRound?.bettingOrder[
      gameState.currentRound.currentBettingIndex
    ];
    return currentBettorId === myPlayerId;
  }
  
  if (gameState.status === 'playing_hand') {
    const currentPlayerId = gameState.currentRound?.currentHand?.handOrder[
      gameState.currentRound.currentHand.currentPlayerIndex
    ];
    return currentPlayerId === myPlayerId;
  }
  
  return false;
}
```

### Getting Player's Hand

```typescript
function getMyHand(gameState: GameState, myPlayerId: string): Card[] {
  const player = gameState.players.find(p => p.id === myPlayerId);
  return player?.hand || [];
}
```

## Error Handling

All actions validate preconditions and throw descriptive errors:

- `'Invalid action'` - Wrong action type for current state
- `'Only admin can start game'` - Non-admin tried to start
- `'Not your turn to bet'` - Player bet out of order
- `'Last player cannot make sum equal to round size'` - Invalid last bet
- `'Not your turn'` - Player played card out of order
- `'Card not in hand'` - Player tried to play card they don't have
- `'Must follow pinta suit'` - Player didn't follow suit when required

## Transaction Safety

All state mutations use Firestore transactions to ensure:
- Atomic updates (all-or-nothing)
- No race conditions between concurrent actions
- Consistent state even with multiple players acting simultaneously

## Testing Considerations

Key scenarios to test:

1. **Betting Phase**
   - Last player constraint enforcement
   - Out-of-turn bet rejection
   - Invalid bet values

2. **Card Play**
   - Suit following rules
   - Out-of-turn play rejection
   - Invalid card rejection

3. **Hand Winner**
   - Mesa > Pinta > Other suits
   - Rank ordering within suits

4. **Scoring**
   - Correct points for matching bet
   - Zero points for missing bet

5. **Round Progression**
   - Correct starting player rotation
   - Hand winner becomes next PH1

6. **Game Completion**
   - All rounds played
   - Final scores calculated
