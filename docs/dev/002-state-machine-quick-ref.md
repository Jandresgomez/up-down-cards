# State Machine Quick Reference

## State Diagram

```
waiting
  │
  ├─ START_GAME (admin) ──→ dealing
  │                           │
  │                           ├─ AUTO ──→ betting
  │                                        │
  │                                        ├─ PLACE_BET (PS1) ──→ betting
  │                                        ├─ PLACE_BET (PS2) ──→ betting
  │                                        ├─ ...
  │                                        └─ PLACE_BET (PSL) ──→ playing_hand
  │                                                                 │
  │                                                                 ├─ AUTO (start hand) ──→ playing_hand
  │                                                                 ├─ PLAY_CARD (PH1) ──→ playing_hand
  │                                                                 ├─ PLAY_CARD (PH2) ──→ playing_hand
  │                                                                 ├─ ...
  │                                                                 └─ PLAY_CARD (PHL) ──→ hand_complete
  │                                                                                         │
  │                                                                                         ├─ AUTO (determine winner) ──→ playing_hand (if more hands)
  │                                                                                         └─ AUTO (determine winner) ──→ round_complete (if round done)
  │                                                                                                                         │
  │                                                                                                                         ├─ AUTO (calc scores) ──→ dealing (if more rounds)
  │                                                                                                                         └─ AUTO (calc scores) ──→ game_complete
```

## Player Actions

| Action | State | Who | Validation |
|--------|-------|-----|------------|
| START_GAME | waiting | Admin only | ≥2 players |
| PLACE_BET | betting | Current bettor (PSK) | 0 ≤ bet ≤ X, last player constraint |
| PLAY_CARD | playing_hand | Current player (PHK) | Card in hand, follow pinta if possible |

## State Transitions

| From | To | Trigger | Auto? |
|------|-----|---------|-------|
| waiting | dealing | START_GAME | No |
| dealing | betting | - | Yes |
| betting | playing_hand | Last bet placed | No |
| playing_hand | playing_hand | Card played (not last) | No |
| playing_hand | hand_complete | Last card played | No |
| hand_complete | playing_hand | More hands in round | Yes |
| hand_complete | round_complete | All hands done | Yes |
| round_complete | dealing | More rounds | Yes |
| round_complete | game_complete | All rounds done | Yes |

## Key Data Structures

### GameState (Root)
```typescript
{
  status: GameStatus
  players: PlayerState[]
  playerOrder: string[]           // [P1, P2, P3...]
  currentRound: RoundState | null
  roundSequence: number[]         // [1,2,3...N...3,2,1]
  completedRounds: RoundResult[]
}
```

### RoundState (Current Round)
```typescript
{
  roundNumber: number             // 1 to N
  cardsPerPlayer: number          // X
  mesa: Card
  startingPlayerId: string        // PS1
  bettingOrder: string[]
  currentBettingIndex: number
  currentHand: HandState | null
  completedHands: HandResult[]
}
```

### HandState (Current Hand)
```typescript
{
  handNumber: number              // 1 to X
  cardsPlayed: PlayedCard[]
  pinta: Suit | null              // First card's suit
  currentPlayerIndex: number
  handOrder: string[]             // [PH1, PH2, PH3...]
}
```

## Validation Rules

### Betting Phase
- ✅ Player must be current bettor
- ✅ Bet must be 0 ≤ bet ≤ cardsPerPlayer
- ✅ Last player: sum of bets ≠ cardsPerPlayer

### Card Play Phase
- ✅ Player must be current player
- ✅ Card must be in player's hand
- ✅ If pinta exists and player has pinta cards → must play pinta
- ✅ Otherwise can play any card

### Hand Winner
- Mesa suit > Pinta suit > Other suits
- Within suit: A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2

### Round Scoring
- bet ≠ handsWon → 0 points
- bet === handsWon → 10 + 2 × handsWon points

## Cloud Functions API

### startGame
```typescript
firebase.functions().httpsCallable('startGame')({
  roomId: string,
  playerId: string  // Must be admin
})
```

### placeBet
```typescript
firebase.functions().httpsCallable('placeBet')({
  playerId: string,
  bet: number
})
```

### playCard
```typescript
firebase.functions().httpsCallable('playCard')({
  playerId: string,
  card: { suit: Suit, rank: Rank }
})
```

## Common Queries

### Is it my turn?
```typescript
function isMyTurn(game: GameState, myId: string): boolean {
  if (game.status === 'betting') {
    return game.currentRound?.bettingOrder[
      game.currentRound.currentBettingIndex
    ] === myId;
  }
  if (game.status === 'playing_hand') {
    return game.currentRound?.currentHand?.handOrder[
      game.currentRound.currentHand.currentPlayerIndex
    ] === myId;
  }
  return false;
}
```

### Get my hand
```typescript
function getMyHand(game: GameState, myId: string): Card[] {
  return game.players.find(p => p.id === myId)?.hand || [];
}
```

### Get current mesa
```typescript
function getMesa(game: GameState): Card | null {
  return game.currentRound?.mesa || null;
}
```

### Get current pinta
```typescript
function getPinta(game: GameState): Suit | null {
  return game.currentRound?.currentHand?.pinta || null;
}
```

### Can I play this card?
```typescript
function canPlayCard(game: GameState, myId: string, card: Card): boolean {
  const myHand = getMyHand(game, myId);
  if (!myHand.some(c => c.suit === card.suit && c.rank === card.rank)) {
    return false; // Card not in hand
  }
  
  const pinta = getPinta(game);
  if (!pinta) return true; // First card, can play anything
  
  const hasPinta = myHand.some(c => c.suit === pinta);
  if (hasPinta && card.suit !== pinta) {
    return false; // Must follow pinta
  }
  
  return true;
}
```

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Only admin can start game" | Non-admin tried START_GAME | Use admin player |
| "Not your turn to bet" | Bet out of order | Wait for your turn |
| "Last player cannot make sum equal to round size" | Invalid last bet | Choose different bet |
| "Not your turn" | Card played out of order | Wait for your turn |
| "Card not in hand" | Invalid card | Check your hand |
| "Must follow pinta suit" | Didn't follow suit | Play pinta card |

## Testing Checklist

- [ ] Game starts with 2+ players
- [ ] Round sequence generated correctly [1,2,3...N...3,2,1]
- [ ] Cards dealt correctly (X per player + 1 mesa)
- [ ] Betting order follows PS1 → PSL
- [ ] Last player constraint enforced
- [ ] Hand order: PS2 first, then winner of previous hand
- [ ] Pinta set from first card
- [ ] Suit following enforced
- [ ] Hand winner determined correctly (mesa > pinta > other)
- [ ] Scores calculated correctly (0 or 10+2×wins)
- [ ] Round progression (PG rotation)
- [ ] Game completes after all rounds
- [ ] Concurrent actions handled safely (transactions)
