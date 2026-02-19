# 001 - Player ID Management & Real-time Room Sync

**Date**: 2026-02-19

## Overview
Implemented player identification system with cookies and Firestore real-time synchronization for multiplayer game rooms.

## Server Changes

### New Cloud Functions
- **createRoom**: Creates room with player as admin
- **joinRoom**: Adds players to room with transaction safety
- **updateRoomSettings**: Admin-only room configuration
- **startGame**: Admin-only game start with validation

### Updated Data Models
```typescript
Room {
  id: string
  adminId: string
  players: Player[]  // Changed from string[]
  currentRound: number  // Added
  status: 'waiting' | 'playing' | 'finished'
  numberOfRounds: number
  maxPlayers: number
  createdAt: number
}

Player {
  id: string
  joinedAt: number
  isAdmin: boolean
}
```

### Test Coverage
- 23 passing tests across 4 test suites
- Tests for createRoom, joinRoom, updateRoomSettings, startGame

## Client Changes

### New Features
- **Player ID Management** (`utils/playerId.ts`): Cookie-based persistent player identification
- **Real-time Sync** (`api/roomSync.ts`): Firestore `onSnapshot` for live room updates
- **Updated API Client** (`api/api.ts`): New functions for room settings and game start

### Updated Components
- **main.ts**: Integrated Firestore sync and player ID throughout app
- **GameState.ts**: Added methods to support synced room data
- **WaitingRoomScreen.ts**: Real-time player count and settings updates

## Game Flow

1. **Create Room**: Player creates room → becomes admin → subscribes to updates
2. **Join Room**: Player joins → added to Firestore → all clients see new player
3. **Update Settings**: Admin changes settings → synced to all clients
4. **Start Game**: Admin starts → all clients transition to game screen

## Technical Decisions

- **Transactions for joinRoom**: Prevents race conditions
- **Cookie-based Player ID**: Simple, persistent, no auth required
- **Firestore as Single Source of Truth**: Automatic sync across clients
- **Server-side Validation**: Admin-only actions enforced on server

## Files Modified

### Server
- `src/index.ts`
- `src/types.ts`
- `tests/rooms/*.test.ts`
- `tests/helpers.ts`

### Client
- `src/main.ts`
- `src/api/api.ts`
- `src/api/roomSync.ts` (new)
- `src/utils/playerId.ts` (new)
- `src/state/GameState.ts`
- `src/scenes/WaitingRoomScreen.ts`
