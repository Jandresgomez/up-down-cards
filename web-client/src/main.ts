import { Application } from 'pixi.js';
import { GameState } from './state/GameState';
import { WelcomeScreen } from './scenes/WelcomeScreen';
import { WaitingRoomScreen } from './scenes/WaitingRoomScreen';
import { GameScreen } from './scenes/GameScreen';
import { createNewRoom, joinRoom } from './api/api';

const app = new Application();
const gameState = new GameState();

let currentScreen: WelcomeScreen | WaitingRoomScreen | GameScreen | null = null;

await app.init({
  resizeTo: window,
  backgroundColor: 0x1a1a2e,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

function showWelcomeScreen(): void {
  if (currentScreen) {
    currentScreen.destroy();
  }

  const welcomeScreen = new WelcomeScreen(
    async (roomNumber) => {
      const response = await joinRoom(roomNumber);
      if (!response.success) {
        welcomeScreen.showError(response.error || 'Failed to join room');
        return;
      }
      gameState.setRoomNumber(roomNumber);
      gameState.joinRoom(roomNumber);
      showWaitingRoomScreen();
    },
    async () => {
      const response = await createNewRoom();
      if (response.success) {
        gameState.setRoomNumber(response.roomId);
        await gameState.createRoom();
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
    (rounds) => {
      gameState.setNumberOfRounds(rounds);
      gameState.startGame();
      showGameScreen();
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
