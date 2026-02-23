# Web Client State Machine Integration

## Overview

The web client has been updated to integrate with the server-side state machine. It now listens to real-time game state updates from Firestore and renders the appropriate UI based on the current game status.

## New Files

### Types
- **`src/types/game-types.ts`** - Complete TypeScript types matching server-side GameState
  - Includes display helpers (SUIT_SYMBOLS, SUIT_COLORS)

### API
- **`src/api/gameStateListener.ts`** - Firestore real-time listener
  - `subscribeToGameState()` - Subscribe to game state changes

### Utilities
- **`src/utils/gameHelpers.ts`** - Game logic helpers
  - `isMyTurn()` - Check if it's the player's turn
  - `getMyHand()` - Get player's current hand
  - `canPlayCard()` - Validate if a card can be played
  - `getValidBets()` - Get valid bet options
  - `getMesaSuit()`, `getPintaSuit()` - Get current suits
  - `getCurrentBettor()`, `getCurrentPlayer()` - Get current turn player

### Scenes
- **`src/scenes/GameScreenV2.ts`** - New game screen with state machine integration
  - Real-time rendering based on game status
  - Betting UI (when status = 'betting')
  - Card play UI (when status = 'playing_hand')
  - Table cards display
  - Player info and scores

### Main
- **`src/main.ts`** - Updated application entry point
  - Manages screen transitions based on game status
  - Subscribes to game state updates
  - Handles room creation/joining

## Updated Files

### API
- **`src/api/api.ts`** - Added new Cloud Functions
  - `placeBet(bet)` - Place a bet
  - `playCard(card)` - Play a card
  - Updated `createNewRoom()` to accept maxRoundSize
  - Updated `updateRoomSettings()` to use maxRoundSize

## Game Flow

### 1. Welcome Screen
- Player creates or joins a room
- On success, subscribes to game state updates
- Transitions to Waiting Room

### 2. Waiting Room (status = 'waiting')
- Shows room ID and player count
- Admin can configure maxRoundSize and maxPlayers
- Admin can start game
- Automatically transitions when game starts

### 3. Game Screen (status ≠ 'waiting')
The game screen adapts to the current game status:

#### Status: 'dealing'
- Shows "Dealing cards..." message
- Displays mesa card
- Auto-transitions to betting

#### Status: 'betting'
- Shows current round info and mesa
- Displays betting UI when it's player's turn
- Shows other players' bets
- Buttons for valid bet amounts (respects last-player constraint)

#### Status: 'playing_hand'
- Shows current hand info (mesa, pinta)
- Displays player's hand
- Cards are clickable when it's player's turn
- Only valid cards are enabled (suit following enforced)
- Shows cards played on table in circular arrangement

#### Status: 'hand_complete'
- Brief pause while server determines winner
- Auto-transitions to next hand or round_complete

#### Status: 'round_complete'
- Shows round results and scores
- Auto-transitions to next round or game_complete

#### Status: 'game_complete'
- Shows final scores
- Displays winner

## UI Components

### Info Panel (Top Left)
```
Room: ABC123
Status: betting
Round: 3 (3 cards)
Mesa: K♠
Pinta: ♥

Your Score: 24
Your Bet: 2
Hands Won: 1

>>> YOUR TURN <<<
```

### Betting UI (Center, when betting)
```
Place Your Bet
[0] [1] [2] [3]
```
- Only valid bets shown
- Last player cannot make sum = round size

### Player Hand (Bottom)
```
[A♠] [K♥] [Q♦] [10♣] [J♠]
```
- Cards elevated on hover when playable
- Grayed out when not playable
- Click to play when it's your turn

### Table Cards (Center)
```
    [5♥]
[2♥]    [K♥]
    [A♥]
```
- Arranged in circle
- Shows player labels (P1, P2, etc.)

## Real-time Updates

The client subscribes to Firestore changes:

```typescript
subscribeToGameState(roomId, (gameState) => {
  // Update UI based on gameState.status
  // Re-render components
  // Show/hide betting UI
  // Enable/disable cards
});
```

All state mutations happen server-side. The client only:
1. Sends actions (placeBet, playCard)
2. Listens to state changes
3. Renders UI accordingly

## Card Validation

Before allowing a card to be played:

```typescript
canPlayCard(gameState, myPlayerId, card)
```

Checks:
1. Card is in player's hand
2. If pinta exists and player has pinta cards → must play pinta
3. Otherwise can play any card

## Bet Validation

Before showing bet buttons:

```typescript
getValidBets(gameState, myPlayerId)
```

Returns:
- All numbers from 0 to cardsPerPlayer
- Except the invalid bet for last player (sum ≠ cardsPerPlayer)

## Error Handling

All API calls include error handling:

```typescript
try {
  const result = await placeBet(bet);
  if (!result.success) {
    console.error('Failed:', result.error);
  }
} catch (error) {
  console.error('Error:', error);
}
```

Errors are logged to console. Future enhancement: show error messages to user.

## Testing Locally

1. Start Firebase emulators:
```bash
cd server
npm run serve
```

2. Start web client:
```bash
cd web-client
npm run dev
```

3. Open multiple browser windows to test multiplayer

## Known Limitations

1. **No reconnection handling** - If connection drops, page must be refreshed
2. **No error UI** - Errors only logged to console
3. **No loading states** - Actions appear instant (good for local, may need spinners for production)
4. **No animations** - Cards appear/disappear instantly
5. **No sound effects** - Silent gameplay
6. **No chat** - Players can't communicate
7. **No spectator mode** - Must be a player to view game

## Future Enhancements

### High Priority
- [ ] Error messages displayed to user
- [ ] Loading states for actions
- [ ] Reconnection handling
- [ ] Better mobile responsiveness

### Medium Priority
- [ ] Card play animations
- [ ] Sound effects
- [ ] Winner celebration screen
- [ ] Game history/replay
- [ ] Player avatars/names

### Low Priority
- [ ] Chat system
- [ ] Spectator mode
- [ ] Game statistics
- [ ] Leaderboards
- [ ] Custom card designs

## Deployment

Build for production:
```bash
cd web-client
npm run build
```

Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

The client will automatically connect to production Cloud Functions and Firestore.
