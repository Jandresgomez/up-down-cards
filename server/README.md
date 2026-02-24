# Express Server Setup

This directory contains the Express.js server that replaces Firebase Cloud Functions.

## Prerequisites

- Node.js 22+
- Firebase service account key
- Docker (optional, for containerized deployment)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Service Account

Download your Firebase service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/project/up-down-cards/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in the `server/` directory

**⚠️ Never commit this file to git!**

### 3. Set Environment Variable

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
```

Or create a `.env` file:
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
PORT=3000
```

## Running Locally

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

Server runs on `http://localhost:3000`

## Docker Deployment

### Build Image

```bash
docker build -t up-down-cards-server .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -v $(pwd)/serviceAccountKey.json:/app/serviceAccountKey.json:ro \
  up-down-cards-server
```

### Using Docker Compose

```bash
docker-compose up -d
```

Stop:
```bash
docker-compose down
```

## API Endpoints

All endpoints accept JSON and return JSON.

### Room Management

- `POST /createRoom` - Create a new game room
  ```json
  { "playerId": "string", "numberOfRounds": 5 }
  ```

- `POST /joinRoom` - Join existing room
  ```json
  { "roomId": "string", "playerId": "string" }
  ```

- `POST /updateRoomSettings` - Update room settings (admin only)
  ```json
  { "roomId": "string", "playerId": "string", "numberOfRounds": 5, "maxPlayers": 6 }
  ```

- `POST /leaveRoom` - Leave a room
  ```json
  { "roomId": "string", "playerId": "string" }
  ```

- `POST /closeRoom` - Close room (admin only)
  ```json
  { "roomId": "string", "playerId": "string" }
  ```

### Game Actions

- `POST /startGame` - Start the game
  ```json
  { "roomId": "string", "playerId": "string" }
  ```

- `POST /placeBet` - Place a bet
  ```json
  { "playerId": "string", "bet": 2 }
  ```

- `POST /playCard` - Play a card
  ```json
  { "playerId": "string", "card": { "suit": "hearts", "rank": "A" } }
  ```

- `POST /continueGame` - Continue to next round/hand
  ```json
  { "playerId": "string" }
  ```

### Health Check

- `GET /health` - Server health status
  ```json
  { "status": "ok" }
  ```

## Deployment to Your Machine

### Option 1: Direct Node.js

1. Build the project:
   ```bash
   npm run build
   ```

2. Set up service account:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
   ```

3. Run:
   ```bash
   npm start
   ```

4. Keep running with PM2:
   ```bash
   npm install -g pm2
   pm2 start lib/server.js --name up-down-cards
   pm2 save
   pm2 startup
   ```

### Option 2: Docker

1. Ensure `serviceAccountKey.json` is in the `server/` directory

2. Build and run:
   ```bash
   docker-compose up -d
   ```

3. Check logs:
   ```bash
   docker-compose logs -f
   ```

## Updating the Client

Update the API base URL in `web-client/src/api/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000'; // or your server IP
```

For production, use your server's public IP or domain:
```typescript
const API_BASE_URL = 'http://your-server-ip:3000';
```

## Firestore Connection

The server connects to your Firebase project's Firestore database using the service account credentials. No additional configuration needed.

## Troubleshooting

**Port already in use:**
```bash
# Change port
PORT=3001 npm start
```

**Firebase connection issues:**
- Verify `serviceAccountKey.json` is correct
- Check `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Ensure Firestore is enabled in Firebase Console

**Docker issues:**
- Ensure `serviceAccountKey.json` exists before building
- Check container logs: `docker logs <container-id>`

## Security Notes

- Add `serviceAccountKey.json` to `.gitignore`
- Use environment variables for sensitive data
- Enable CORS only for your client domain in production
- Consider adding rate limiting for production use
