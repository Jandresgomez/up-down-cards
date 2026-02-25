import { Application } from 'pixi.js';
import { WelcomeScreen } from './scenes/WelcomeScreen';
import { WaitingRoomScreen } from './scenes/WaitingRoomScreen';
import { GameScreen } from './scenes/GameScreen';
import { ReconnectScreen } from './scenes/ReconnectScreen';
import { createNewRoom, joinRoom, updateRoomSettings, startGame } from './api/api';
import { subscribeToGameState } from './api/gameStateListener';
import { getPlayerId, getCurrentRoomId, setCurrentRoomId, clearCurrentRoomId } from './utils/playerId';
import { GameState } from './types/game-types';
import { Unsubscribe } from 'firebase/firestore';

const app = new Application();

let currentScreen: WelcomeScreen | WaitingRoomScreen | GameScreen | ReconnectScreen | null = null;
let gameStateUnsubscribe: Unsubscribe | null = null;
let currentRoomId: string | null = null;
let isAdmin: boolean = false;

// Initialize player ID on load
const playerId = getPlayerId();
console.log('Player ID:', playerId);

async function initApp() {
  await app.init({
    resizeTo: window,
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  document.body.appendChild(app.canvas);

  // Check for existing room on load
  const savedRoomId = getCurrentRoomId();
  if (savedRoomId) {
    console.log('Found saved room:', savedRoomId);
    showReconnectScreen(savedRoomId);
  } else {
    // Start with welcome screen
    showWelcomeScreen();
  }
}

initApp().catch(console.error);

function handleGameStateUpdate(gameState: GameState): void {
  console.log('Game state updated:', gameState.status);

  // Determine if we're admin
  isAdmin = gameState.adminId === playerId;

  // Clear room ID when game completes
  if (gameState.status === 'game_complete') {
    clearCurrentRoomId();
  }

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

function subscribeToRoom(roomId: string): void {
  gameStateUnsubscribe = subscribeToGameState(
    roomId,
    handleGameStateUpdate,
    (error) => {
      console.error('Game state subscription error:', error);
    }
  );
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
      setCurrentRoomId(roomNumber); // Save to localStorage

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
        setCurrentRoomId(response.roomId); // Save to localStorage

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
    },
    async () => {
      // Leave room
      const { leaveRoom } = await import('./api/api');
      const response = await leaveRoom(gameState.id);
      if (response.success) {
        clearCurrentRoomId();
        if (gameStateUnsubscribe) {
          gameStateUnsubscribe();
          gameStateUnsubscribe = null;
        }
        showWelcomeScreen();
      }
    },
    async () => {
      // Close room (admin only)
      if (isAdmin) {
        const { closeRoom } = await import('./api/api');
        const response = await closeRoom(gameState.id);
        if (response.success) {
          clearCurrentRoomId();
          if (gameStateUnsubscribe) {
            gameStateUnsubscribe();
            gameStateUnsubscribe = null;
          }
          showWelcomeScreen();
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
  } else if (currentScreen instanceof WelcomeScreen) {
    // WelcomeScreen handles its own resize internally
  } else if (currentScreen instanceof WaitingRoomScreen) {
    // WaitingRoomScreen will handle its own resize
  }
});

function showReconnectScreen(roomId: string): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const reconnectScreen = new ReconnectScreen(
    roomId,
    async () => {
      // Reconnect
      const response = await joinRoom(roomId);
      if (response.success) {
        currentRoomId = roomId;
        subscribeToRoom(roomId);
      } else {
        console.log('Failed to rejoin room:', response.error);
        clearCurrentRoomId();
        showWelcomeScreen();
      }
    },
    () => {
      // Main menu
      clearCurrentRoomId();
      showWelcomeScreen();
    }
  );

  app.stage.addChild(reconnectScreen.getContainer());
  currentScreen = reconnectScreen;
}
