import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes } from '../../../utils/responsive';

export class GamePlayerIndicators extends Container {
  private gameState: GameState | null = null;
  private myPlayerId: string = '';

  update(gameState: GameState, myPlayerId: string): void {
    this.gameState = gameState;
    this.myPlayerId = myPlayerId;
    this.render();
  }

  private render(): void {
    this.removeChildren();
    if (!this.gameState?.currentRound) return;

    const sizes = getResponsiveSizes();
    const players = this.gameState.players;
    const currentHand = this.gameState.currentRound.currentHand;
    const currentPlayerId = currentHand ? currentHand.handOrder[currentHand.currentPlayerIndex] : null;

    const indicatorWidth = sizes.isMobile ? 100 : 120;
    const indicatorHeight = sizes.isMobile ? 50 : 60;
    const spacing = 10;

    // Calculate how many indicators fit per row
    const availableWidth = sizes.width - (sizes.spacing * 2);
    const indicatorsPerRow = Math.floor((availableWidth + spacing) / (indicatorWidth + spacing));

    let currentX = sizes.spacing;
    let currentY = sizes.spacing;
    let currentRow = 0;

    players.forEach((player, index) => {
      // New row if we've filled the current one
      if (index > 0 && index % indicatorsPerRow === 0) {
        currentRow++;
        currentX = sizes.spacing;
        currentY = sizes.spacing + currentRow * (indicatorHeight + spacing);
      }

      const indicator = new Container();
      const isCurrentPlayer = player.id === currentPlayerId;

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, indicatorWidth, indicatorHeight, 8);
      bg.fill(isCurrentPlayer ? 0x4caf50 : 0x2a2a3e);
      bg.stroke({ width: 2, color: isCurrentPlayer ? 0x66ff66 : 0x4a4a5e });
      indicator.addChild(bg);

      // Player shorthand
      const nameText = new Text({
        text: player.shorthand || `P${index + 1}`,
        style: { fontSize: sizes.isMobile ? 14 : 16, fill: 0xffffff, fontWeight: 'bold' }
      });
      nameText.x = 8;
      nameText.y = 6;
      indicator.addChild(nameText);

      // Bet and wins
      const betText = new Text({
        text: `Bet: ${player.bet ?? '-'}`,
        style: { fontSize: sizes.isMobile ? 11 : 13, fill: 0xaaaaaa }
      });
      betText.x = 8;
      betText.y = sizes.isMobile ? 24 : 28;
      indicator.addChild(betText);

      const winsText = new Text({
        text: `Won: ${player.handsWon}`,
        style: { fontSize: sizes.isMobile ? 11 : 13, fill: 0xaaaaaa }
      });
      winsText.x = 8;
      winsText.y = sizes.isMobile ? 36 : 44;
      indicator.addChild(winsText);

      indicator.x = currentX;
      indicator.y = currentY;
      this.addChild(indicator);

      currentX += indicatorWidth + spacing;
    });
  }
}
