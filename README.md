# Up-Down Cards

A multiplayer card game built with a client-server architecture using Firebase Cloud Functions and Firestore for backend services, and PixiJS for the web client.

## Documentation

### Game Information
- [Game Logic](./docs/info/game-logic.md) - Complete rules and gameplay

### Development Documentation
Implementation details and feature documentation can be found in `/docs/dev/`:
- [001 - Player ID Management & Real-time Room Sync](./docs/dev/001-player-id-and-realtime-sync.md)
- [002 - State Machine Implementation](./docs/dev/002-state-machine.md)
- [002 - State Machine Summary](./docs/dev/002-state-machine-summary.md)
- [002 - State Machine Quick Reference](./docs/dev/002-state-machine-quick-ref.md)

## Project Overview

Up-Down Cards is a web-based multiplayer card game where players can create or join game rooms, configure game settings, and play rounds of cards together in real-time.

## Architecture

### Client-Server Model

- **Client**: Web application built with PixiJS and TypeScript
- **Server**: Firebase Cloud Functions (Node.js 22)
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting

## Project Structure

```
up-down-cards/
├── web-client/          # Frontend application
│   ├── src/
│   │   ├── scenes/      # Game screens (Welcome, Waiting Room, Game)
│   │   ├── state/       # Game state management
│   │   ├── api/         # Firebase Cloud Functions API client
│   │   ├── firebase.ts  # Firebase configuration
│   │   └── main.ts      # Application entry point
│   ├── index.html
│   └── package.json
├── server/              # Backend Cloud Functions
│   ├── src/
│   │   ├── index.ts     # Cloud Functions definitions
│   │   └── types.ts     # TypeScript interfaces
│   └── package.json
├── firebase.json        # Firebase project configuration
├── firestore.rules      # Firestore security rules
└── firestore.indexes.json
```

## Technology Stack

### Frontend (web-client/)
- **PixiJS 8.16**: 2D rendering engine for game graphics
- **@pixi/ui 2.3**: UI components for PixiJS
- **Firebase SDK 12.9**: Client SDK for Firebase services
- **Vite 7.3**: Build tool and dev server
- **TypeScript 5.9**: Type-safe JavaScript

### Backend (server/)
- **Firebase Functions 7.0**: Serverless cloud functions
- **Firebase Admin SDK 13.6**: Server-side Firebase operations
- **TypeScript 5.9**: Type-safe JavaScript
- **Node.js 18**: Runtime environment

## Key Components

### Client Screens

1. **WelcomeScreen** (`web-client/src/scenes/WelcomeScreen.ts`)
   - Entry point for players
   - Options to create new room or join existing room
   - Room ID input validation

2. **WaitingRoomScreen** (`web-client/src/scenes/WaitingRoomScreen.ts`)
   - Lobby for players before game starts
   - Room configuration (number of rounds, max players)
   - Admin controls to start game

3. **GameScreen** (`web-client/src/scenes/GameScreen.ts`)
   - Main gameplay interface
   - Card rendering and interaction
   - Round tracking

### State Management

**GameState** (`web-client/src/state/GameState.ts`)
- Manages current screen navigation
- Tracks room information and player role (admin/player)
- Handles game configuration (rounds, players)
- Manages player hand and table cards
- Card types: Standard 52-card deck with suits (♠♥♦♣) and ranks (A-K)

### API Layer

**API Client** (`web-client/src/api/api.ts`)
- `createNewRoom()`: Creates a new game room
- `joinRoom(roomId)`: Joins an existing room by ID

### Cloud Functions

**Server Functions** (`server/src/index.ts`)

1. **createRoom**
   - Generates unique 6-character room ID
   - Initializes room with default settings
   - Returns room ID to client

2. **joinRoom**
   - Validates room ID
   - Checks room status and capacity
   - Returns success/error response

### Data Models

**Room** (`server/src/types.ts`)
```typescript
{
  id: string
  adminId: string
  createdAt: number
  status: 'waiting' | 'playing' | 'finished'
  numberOfRounds: number
  maxPlayers: number
  players: string[]
}
```

**Player** (`server/src/types.ts`)
```typescript
{
  id: string
  roomId: string
  joinedAt: number
}
```

## Development Setup

### Prerequisites
- Node.js 18+
- Firebase CLI
- npm or yarn

### Installation

1. Install dependencies for both client and server:
```bash
# Install client dependencies
cd web-client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running Locally

**Start Firebase Emulators (Server)**
```bash
cd server
npm run serve
```

**Start Client Dev Server**
```bash
cd web-client
npm run dev
```

### Building

**Build Client**
```bash
cd web-client
npm run build
```

**Build Server**
```bash
cd server
npm run build
```

## Deployment

### Deploy Cloud Functions
```bash
cd server
npm run deploy
```

### Deploy Hosting
```bash
firebase deploy --only hosting
```

### Deploy Everything
```bash
firebase deploy
```

## Firebase Configuration

- **Project ID**: Configured in `.firebaserc`
- **Firestore Location**: nam5 (North America)
- **Functions Region**: Default (us-central1)
- **Hosting**: Serves from `web-client/dist`

## Security

⚠️ **Current Firestore Rules**: Open access until March 20, 2026. Update security rules before production deployment.

## Game Flow

1. Player lands on Welcome Screen
2. Player creates new room OR joins existing room with ID
3. Players wait in Waiting Room
4. Room admin configures game settings
5. Admin starts game
6. Players play rounds of cards
7. Game ends after configured number of rounds

## Future Enhancements

- Real-time player synchronization
- Actual game logic implementation
- Secure authentication
- Production-ready Firestore security rules
- Player profiles and statistics
- Game history and replay
