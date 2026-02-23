import { Application } from 'pixi.js';
import { WelcomeScreen } from './scenes/WelcomeScreen';
import { WaitingRoomScreen } from './scenes/WaitingRoomScreen';
import { GameScreen } from './scenes/GameScreen';
import { createNewRoom, joinRoom, updateRoomSettings, startGame } from './api/api';
import { subscribeToGameState } from './api/gameStateListener';
import { getPlayerId } from './utils/playerId';
import { GameState } from './types/game-types';
import { Unsubscribe } from 'firebase/firestore';

const app = new Application();

let currentScreen: WelcomeScreen | WaitingRoomScreen | GameScreen | null = null;
let gameStateUnsubscribe: Unsubscribe | null = null;
let currentRoomId: string | null = null;
let isAdmin: boolean = false;

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

function handleGameStateUpdate(gameState: GameState): void {
  console.log('Game state updated:', gameState.status);

  // Determine if we're admin
  isAdmin = gameState.adminId === playerId;

  // Handle screen transitions
  if (gameState.status === 'waiting') {
    if (!(currentScreen instanceof WaitingRoomScreen)) {
      showWaitingRoomScreen(gameState);
    } else {
      // Update existing waiting room
      currentScreen.updatePlayers(gameState.players.length);
      currentScreen.updateSettings(gameState.numberOfRounds, gameState.maxPlayers, gameState.players.length);
    }
  } else if (gameState.status !== 'waiting') {
    // Game has started or is in progress
    if (!(currentScreen instanceof GameScreen)) {
      showGameScreen(gameState);
    } else {
      // Update existing game screen
      currentScreen.updateGameState(gameState);
    }
  }
}

function showWelcomeScreen(): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  // Unsubscribe from game state updates
  if (gameStateUnsubscribe) {
    gameStateUnsubscribe();
    gameStateUnsubscribe = null;
  }

  const welcomeScreen = new WelcomeScreen(
    async (roomNumber) => {
      const response = await joinRoom(roomNumber);
      if (!response.success) {
        welcomeScreen.showError(response.error || 'Failed to join room');
        return;
      }

      currentRoomId = roomNumber;

      // Subscribe to game state updates
      gameStateUnsubscribe = subscribeToGameState(
        roomNumber,
        handleGameStateUpdate,
        (error) => {
          console.error('Game state subscription error:', error);
          welcomeScreen.showError('Lost connection to game');
        }
      );
    },
    async () => {
      const response = await createNewRoom();
      if (response.success) {
        currentRoomId = response.roomId;

        // Subscribe to game state updates
        gameStateUnsubscribe = subscribeToGameState(
          response.roomId,
          handleGameStateUpdate,
          (error) => {
            console.error('Game state subscription error:', error);
          }
        );
      }
    }
  );

  app.stage.addChild(welcomeScreen.getContainer());
  currentScreen = welcomeScreen;
}

function showWaitingRoomScreen(gameState: GameState): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const waitingRoom = new WaitingRoomScreen(
    gameState.id,
    isAdmin,
    gameState.players.length,
    gameState.numberOfRounds,
    Math.floor(51 / gameState.players.length),
    async (rounds) => {
      // Update settings on server
      if (isAdmin) {
        await updateRoomSettings(gameState.id, { numberOfRounds: rounds });
      }
    },
    async () => {
      // Start game on server
      if (isAdmin) {
        const response = await startGame(gameState.id);
        if (!response.success) {
          console.error('Failed to start game:', response.error);
        }
      }
    }
  );

  app.stage.addChild(waitingRoom.getContainer());
  currentScreen = waitingRoom;
}

function showGameScreen(gameState: GameState): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const gameScreen = new GameScreen(gameState.id);
  gameScreen.updateGameState(gameState);

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
