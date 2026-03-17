import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Button } from '../components/Button';
import { isMobile } from '../../../utils/responsive';
import { BG_OVERLAY, BG_PANEL, SUCCESS, DISABLED, TEXT_PRIMARY, TEXT_SECONDARY, ERROR_SOFT } from '../../../utils/colors';

export class RoundCompleteOverlay extends Container {
  constructor(gameState: GameState, myPlayerId: string, playerNames: Record<string, { name: string }>, onContinue: () => void) {
    super();

    if (!gameState.currentRound) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const mobile = isMobile();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight);
    bg.fill({ color: BG_OVERLAY, alpha: 0.8 });
    this.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const panelWidth = mobile ? screenWidth * 0.85 : 700;
    const panelHeight = mobile ? screenHeight * 0.7 : 600;
    const panelBg = new Graphics();
    panelBg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
    panelBg.fill(BG_PANEL);
    panelBg.stroke({ width: 4, color: SUCCESS });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Round Complete!',
      style: { fontSize: mobile ? 32 : 48, fill: SUCCESS, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -panelHeight / 2 + (mobile ? 40 : 60);
    panel.addChild(title);

    // Round info
    const roundInfo = new Text({
      text: `Round ${gameState.currentRound.roundNumber}`,
      style: { fontSize: mobile ? 24 : 32, fill: TEXT_PRIMARY }
    });
    roundInfo.anchor.set(0.5);
    roundInfo.y = title.y + (mobile ? 50 : 60);
    panel.addChild(roundInfo);

    // Scores
    let yPos = roundInfo.y + (mobile ? 50 : 60);
    gameState.players.forEach((player, index) => {
      const points = player.bet === player.handsWon ? 10 + 2 * player.handsWon : 0;
      const profile = playerNames[player.id];
      const label = profile?.name || `P${index + 1}`;
      const scoreText = new Text({
        text: `${label}: Bet ${player.bet}, Won ${player.handsWon} → +${points} (Total: ${player.totalScore})`,
        style: { fontSize: mobile ? 14 : 20, fill: points > 0 ? SUCCESS : ERROR_SOFT }
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
      style: { fontSize: mobile ? 16 : 20, fill: TEXT_SECONDARY }
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
      hasClicked ? DISABLED : SUCCESS
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
