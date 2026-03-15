# Up-Down Cards

A multiplayer card game built with a client-server architecture using Express.js backend with Firebase Firestore for data storage, and PixiJS for the web client.

## Documentation

### Game Information
- [Game Logic](./docs/info/game-logic.md) - Complete rules and gameplay

## Project Overview

Up-Down Cards is a web-based multiplayer card game where players can create or join game rooms, configure game settings, and play rounds of cards together in real-time.

## Architecture

### Client-Server Model

- **Client**: Web application built with PixiJS and TypeScript
- **Server**: Express.js server (Node.js 22) that stores data in Firebase Firestore
- **Database**: Cloud Firestore (real-time NoSQL database)
- **Hosting**: Vercel for Backend + Firebase Hosting for web-client

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

The client will connect to `http://localhost:3001` (Express server), which connects to the Firestore emulator.

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

TODO: provide detailed vercel cli explanation

### Deploy Client

Update `web-client/.env.production` with your server URL, then:

```bash
cd web-client
npm run release
```

This builds the client and deploys to Firebase Hosting.

### Deploy Hosting
```bash
firebase deploy --only hosting
```

## Firebase Configuration

- **Project ID**: Configured in `.firebaserc`
- **Firestore Location**: nam5 (North America)
- **Functions Region**: Default (us-central1)
- **Hosting**: Serves from `web-client/dist`