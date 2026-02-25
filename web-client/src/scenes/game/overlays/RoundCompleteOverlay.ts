import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Button } from '../components/Button';
import { isMobile } from '../../../utils/responsive';

export class RoundCompleteOverlay extends Container {
  constructor(gameState: GameState, myPlayerId: string, onContinue: () => void) {
    super();

    if (!gameState.currentRound) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const mobile = isMobile();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const panelWidth = mobile ? screenWidth * 0.85 : 700;
    const panelHeight = mobile ? screenHeight * 0.7 : 600;
    const panelBg = new Graphics();
    panelBg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
    panelBg.fill(0x1a1a2e);
    panelBg.stroke({ width: 4, color: 0x4caf50 });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Round Complete!',
      style: { fontSize: mobile ? 32 : 48, fill: 0x4caf50, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -panelHeight / 2 + (mobile ? 40 : 60);
    panel.addChild(title);

    // Round info
    const roundInfo = new Text({
      text: `Round ${gameState.currentRound.roundNumber}`,
      style: { fontSize: mobile ? 24 : 32, fill: 0xffffff }
    });
    roundInfo.anchor.set(0.5);
    roundInfo.y = title.y + (mobile ? 50 : 60);
    panel.addChild(roundInfo);

    // Scores
    let yPos = roundInfo.y + (mobile ? 50 : 60);
    gameState.players.forEach((player, index) => {
      const points = player.bet === player.handsWon ? 10 + 2 * player.handsWon : 0;
      const scoreText = new Text({
        text: `P${index + 1}: Bet ${player.bet}, Won ${player.handsWon} → +${points} (Total: ${player.totalScore})`,
        style: { fontSize: mobile ? 14 : 20, fill: points > 0 ? 0x4caf50 : 0xff6b6b }
      });
      scoreText.anchor.set(0.5);
      scoreText.y = yPos;
      panel.addChild(scoreText);
      yPos += mobile ? 30 : 40;
    });

    // Ready status
    const playersReady = gameState.currentRound.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${gameState.players.length}`,
      style: { fontSize: mobile ? 16 : 20, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.y = yPos + (mobile ? 30 : 40);
    panel.addChild(readyText);

    // Continue button
    const hasClicked = playersReady.includes(myPlayerId);
    const btnWidth = mobile ? 160 : 200;
    const btnHeight = mobile ? 50 : 60;
    const continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      btnWidth,
      btnHeight,
      hasClicked ? 0x666666 : 0x4caf50
    );
    continueBtn.x = -btnWidth / 2;
    continueBtn.y = readyText.y + (mobile ? 40 : 50);
    if (!hasClicked) {
      continueBtn.on('pointerdown', onContinue);
    }
    panel.addChild(continueBtn);

    this.addChild(panel);
  }
}
