import { Application } from 'pixi.js';
import { GameState } from './state/GameState';
import { WelcomeScreen } from './scenes/WelcomeScreen';
import { WaitingRoomScreen } from './scenes/WaitingRoomScreen';
import { GameScreen } from './scenes/GameScreen';
import { createNewRoom, joinRoom, updateRoomSettings, startGame } from './api/api';
import { subscribeToRoom, RoomData } from './api/roomSync';
import { getPlayerId } from './utils/playerId';
import { Unsubscribe } from 'firebase/firestore';

const app = new Application();
const gameState = new GameState();

let currentScreen: WelcomeScreen | WaitingRoomScreen | GameScreen | null = null;
let roomUnsubscribe: Unsubscribe | null = null;

// Initialize player ID on load
const playerId = getPlayerId();
console.log('Player ID:', playerId);

await app.init({
  resizeTo: window,
  backgroundColor: 0x1a1a2e,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

function handleRoomUpdate(room: RoomData): void {
  // Update game state with room data
  gameState.setNumberOfPlayers(room.players.length);
  gameState.setNumberOfRounds(room.numberOfRounds);
  gameState.setMaxPlayers(room.maxPlayers);
  gameState.setCurrentRound(room.currentRound);

  // Check if current player is admin
  const isAdmin = room.players.find(p => p.id === playerId)?.isAdmin || false;

  // Update waiting room if it's the current screen
  if (currentScreen instanceof WaitingRoomScreen) {
    currentScreen.updatePlayers(room.players.length);
    currentScreen.updateSettings(room.numberOfRounds, room.maxPlayers);
  }

  // Transition to game screen if game started
  if (room.status === 'playing' && gameState.getCurrentScreen() === 'waiting') {
    gameState.startGame();
    showGameScreen();
  }
}

function showWelcomeScreen(): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  // Unsubscribe from room updates
  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }

  const welcomeScreen = new WelcomeScreen(
    async (roomNumber) => {
      const response = await joinRoom(roomNumber);
      if (!response.success) {
        welcomeScreen.showError(response.error || 'Failed to join room');
        return;
      }
      gameState.joinRoom(roomNumber, false);

      // Subscribe to room updates
      roomUnsubscribe = subscribeToRoom(roomNumber, gameState, handleRoomUpdate);

      showWaitingRoomScreen();
    },
    async () => {
      const response = await createNewRoom();
      if (response.success) {
        gameState.createRoom(response.roomId);

        // Subscribe to room updates
        roomUnsubscribe = subscribeToRoom(response.roomId, gameState, handleRoomUpdate);

        showWaitingRoomScreen();
      }
    }
  );

  app.stage.addChild(welcomeScreen.getContainer());
  currentScreen = welcomeScreen;
}

function showWaitingRoomScreen(): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const roomId = gameState.getRoomNumber()!;
  const waitingRoom = new WaitingRoomScreen(
    roomId,
    gameState.isRoomAdmin(),
    gameState.getNumberOfPlayers(),
    gameState.getNumberOfRounds(),
    gameState.getMaxRounds(),
    async (rounds) => {
      // Update settings on server
      if (gameState.isRoomAdmin()) {
        await updateRoomSettings(roomId, { numberOfRounds: rounds });
      }
    },
    async () => {
      // Start game on server
      if (gameState.isRoomAdmin()) {
        const response = await startGame(roomId);
        if (!response.success) {
          console.error('Failed to start game:', response.error);
        }
      }
    }
  );

  app.stage.addChild(waitingRoom.getContainer());
  currentScreen = waitingRoom;
}

function showGameScreen(): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const roomId = gameState.getRoomNumber()!;
  const gameScreen = new GameScreen(
    roomId,
    gameState.getCurrentRound(),
    gameState.getNumberOfRounds()
  );
  gameScreen.updateHand(gameState.getPlayerHand());

  app.stage.addChild(gameScreen.getContainer());
  currentScreen = gameScreen;
}

window.addEventListener('resize', () => {
  if (currentScreen instanceof GameScreen) {
    currentScreen.resizeGame();
  }
});

// Start with welcome screen
showWelcomeScreen();
