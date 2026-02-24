# Up-Down Cards

A multiplayer card game built with a client-server architecture using Express.js backend with Firebase Firestore for data storage, and PixiJS for the web client.

## Documentation

### Game Information
- [Game Logic](./docs/info/game-logic.md) - Complete rules and gameplay

### Development Documentation
Implementation details and feature documentation can be found in `/docs/dev/`:
- [001 - Player ID Management & Real-time Room Sync](./docs/dev/001-player-id-and-realtime-sync.md)
- [002 - State Machine Implementation](./docs/dev/002-state-machine.md)
- [002 - State Machine Summary](./docs/dev/002-state-machine-summary.md)
- [002 - State Machine Quick Reference](./docs/dev/002-state-machine-quick-ref.md)
- [003 - Web Client Integration](./docs/dev/003-web-client-integration.md)

## Project Overview

Up-Down Cards is a web-based multiplayer card game where players can create or join game rooms, configure game settings, and play rounds of cards together in real-time.

## Architecture

### Client-Server Model

- **Client**: Web application built with PixiJS and TypeScript
- **Server**: Express.js server (Node.js 22) that stores data in Firebase Firestore
- **Database**: Cloud Firestore (real-time NoSQL database)
- **Hosting**: Self-hosted server + Firebase Hosting for client

### Why Express.js?

The backend uses Express.js instead of Firebase Cloud Functions to:
- Stay on Firebase's free Spark plan (no credit card required)
- Avoid Cloud Functions invocation costs
- Provide full control over hosting and deployment
- Eliminate cold start latency

### Deployment Options

1. **Self-Hosted Express Server** (recommended, free Firebase Spark plan)
   - Run on your own machine, VPS, or cloud provider

2. **Firebase Cloud Functions** (legacy, requires Blaze plan)
   - Serverless, auto-scaling

## Project Structure

```
up-down-cards/
├── web-client/          # Frontend application
│   ├── src/
│   │   ├── scenes/      # Game screens (Welcome, Waiting Room, Game)
│   │   ├── state/       # Game state management
│   │   ├── api/         # Express server API client
│   │   ├── firebase.ts  # Firebase configuration
│   │   └── main.ts      # Application entry point
│   ├── .env.development # Development environment config
│   ├── .env.production  # Production environment config
│   ├── index.html
│   └── package.json
├── server/              # Express.js Backend
│   ├── src/
│   │   ├── app.ts       # Express application
│   │   ├── server.ts    # Server entry point
│   │   ├── game-functions.ts  # Game logic
│   │   ├── state-machine.ts   # State machine
│   │   └── types.ts     # TypeScript interfaces
│   ├── Dockerfile       # Docker container config
│   ├── docker-compose.yml
│   └── package.json
├── firebase.json        # Firebase project configuration
├── firestore.rules      # Firestore security rules
└── firestore.indexes.json
```

## Technology Stack

### Frontend (web-client/)
- **PixiJS 8.16**: 2D rendering engine for game graphics
- **@pixi/ui 2.3**: UI components for PixiJS
- **Firebase SDK 12.9**: Client SDK for Firestore real-time sync
- **Vite 7.3**: Build tool and dev server
- **TypeScript 5.9**: Type-safe JavaScript

### Backend (server/)
- **Express.js 4.21**: Web server framework
- **Firebase Admin SDK 13.6**: Server-side Firestore operations
- **TypeScript 5.9**: Type-safe JavaScript
- **Node.js 22**: Runtime environment
- **Docker**: Containerization support

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
- `updateRoomSettings()`: Updates room configuration
- `startGame()`: Starts the game
- `placeBet()`: Places a bet during betting phase
- `playCard()`: Plays a card during hand
- `continueGame()`: Continues to next round/hand
- `leaveRoom()`: Leaves a room
- `closeRoom()`: Closes a room (admin only)

### Express Server

**Server Endpoints** (`server/src/app.ts`)

All endpoints accept POST requests with JSON body:

1. **POST /createRoom**
   - Generates unique 6-character room ID
   - Initializes game state with default settings
   - Returns room ID to client

2. **POST /joinRoom**
   - Validates room ID
   - Checks room status and capacity
   - Adds player to game state

3. **POST /updateRoomSettings**
   - Updates room configuration (admin only)
   - Validates settings against game rules

4. **POST /startGame**
   - Transitions game to playing state
   - Deals cards and sets up first round

5. **POST /placeBet, /playCard, /continueGame**
   - Handle game actions through state machine
   - Update Firestore with new game state

6. **POST /leaveRoom, /closeRoom**
   - Handle room cleanup and player removal

### Data Models

**GameState** (`server/src/game-types.ts`)
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
- Node.js 22+
- Firebase CLI
- npm or yarn
- Firebase service account key (for server)
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

2. Get Firebase service account key:
   - Visit [Firebase Console](https://console.firebase.google.com/project/up-down-cards/settings/serviceaccounts/adminsdk)
   - Click "Generate new private key"
   - Save as `server/serviceAccountKey.json`

### Running Locally

**Start Firestore Emulator + Express Server**
```bash
# Terminal 1 - Start Firestore emulator
cd server
npm run emulator

# Terminal 2 - Start Express server
cd server
npm run dev
```

**Start Client Dev Server**
```bash
cd web-client
npm run dev
```

The client will connect to `http://localhost:3000` (Express server), which connects to the Firestore emulator.

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

### Deploy Express Server

See [Express Migration Guide](./docs/info/express-migration.md) for deployment options:
- Local machine with PM2
- Docker
- Cloud hosting (Railway, Render, DigitalOcean, etc.)

### Deploy Client

Update `web-client/.env.production` with your server URL, then:

```bash
cd web-client
npm run release
```

This builds the client and deploys to Firebase Hosting.

### Legacy: Deploy Cloud Functions
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
