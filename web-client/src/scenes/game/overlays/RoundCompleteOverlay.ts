import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Button } from '../components/Button';

export class RoundCompleteOverlay extends Container {
  constructor(gameState: GameState, myPlayerId: string, onContinue: () => void) {
    super();

    if (!gameState.currentRound) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const panelBg = new Graphics();
    panelBg.roundRect(-350, -300, 700, 600, 20);
    panelBg.fill(0x1a1a2e);
    panelBg.stroke({ width: 4, color: 0x4caf50 });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Round Complete!',
      style: { fontSize: 48, fill: 0x4caf50, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -240;
    panel.addChild(title);

    // Round info
    const roundInfo = new Text({
      text: `Round ${gameState.currentRound.roundNumber}`,
      style: { fontSize: 32, fill: 0xffffff }
    });
    roundInfo.anchor.set(0.5);
    roundInfo.y = -180;
    panel.addChild(roundInfo);

    // Scores
    let yPos = -120;
    gameState.players.forEach((player, index) => {
      const points = player.bet === player.handsWon ? 10 + 2 * player.handsWon : 0;
      const scoreText = new Text({
        text: `Player ${index + 1}: Bet ${player.bet}, Won ${player.handsWon} → +${points} pts (Total: ${player.totalScore})`,
        style: { fontSize: 20, fill: points > 0 ? 0x4caf50 : 0xff6b6b }
      });
      scoreText.anchor.set(0.5);
      scoreText.y = yPos;
      panel.addChild(scoreText);
      yPos += 40;
    });

    // Ready status
    const playersReady = gameState.currentRound.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${gameState.players.length}`,
      style: { fontSize: 20, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.y = yPos + 40;
    panel.addChild(readyText);

    // Continue button
    const hasClicked = playersReady.includes(myPlayerId);
    const continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      200,
      60,
      hasClicked ? 0x666666 : 0x4caf50
    );
    continueBtn.x = -100;
    continueBtn.y = yPos + 90;
    if (!hasClicked) {
      continueBtn.on('pointerdown', onContinue);
    }
    panel.addChild(continueBtn);

    this.addChild(panel);
  }
}
