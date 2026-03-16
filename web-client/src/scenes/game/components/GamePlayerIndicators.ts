import { Container, Graphics, isMobile, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes } from '../../../utils/responsive';

export type IndicatorMode = 'betting' | 'playing';

export class GamePlayerIndicators extends Container {
  private gameState: GameState | null = null;
  private playerNames: Record<string, { name: string }> = {};
  private mode: IndicatorMode;

  private readonly onResize = () => { if (this.gameState) this.render(); };

  constructor(mode: IndicatorMode = 'playing') {
    super();
    this.mode = mode;
    window.addEventListener('resize', this.onResize);
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    super.destroy();
  }

  update(
    gameState: GameState,
    playerNames: Record<string, { name: string }> = {},
  ): void {
    this.gameState = gameState;
    this.playerNames = playerNames;
    this.render();
  }

  private render(): void {
    this.removeChildren();
    if (!this.gameState?.currentRound) return;

    const sizes = getResponsiveSizes();
    const players = this.gameState.players;
    const isBettingPhase = this.mode === 'betting';

    // Determine current player based on mode
    let currentPlayerId: string | null = null;
    if (isBettingPhase) {
      const { bettingOrder, currentBettingIndex } = this.gameState.currentRound;
      currentPlayerId = bettingOrder[currentBettingIndex] ?? null;
    } else {
      const currentHand = this.gameState.currentRound.currentHand;
      currentPlayerId = currentHand ? currentHand.handOrder[currentHand.currentPlayerIndex] : null;
    }


    const indicatorHeight = sizes.isMobile ? 64 : 72;

    const indicatorWidth = sizes.isMobile ? 140 : 200;
    const indicatorsPerRow = Math.floor((sizes.width - sizes.padding) / (indicatorWidth + sizes.padding));

    const Xspacing = (sizes.width - (indicatorWidth * indicatorsPerRow)) / (indicatorsPerRow + 1);
    let currentX = Xspacing;
    let currentY = 0;
    let currentRow = 0;

    players.forEach((player, index) => {
      if (index > 0 && index % indicatorsPerRow === 0) {
        currentRow++;
        currentX = Xspacing;
        currentY = currentRow * (indicatorHeight + sizes.spacing);
      }

      const indicator = new Container();
      const isCurrentPlayer = player.id === currentPlayerId;

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, indicatorWidth, indicatorHeight, 8);
      bg.fill(isCurrentPlayer ? 0x4caf50 : 0x2a2a3e);
      bg.stroke({ width: 2, color: isCurrentPlayer ? 0x66ff66 : 0x4a4a5e });
      indicator.addChild(bg);

      // Player name
      const profile = this.playerNames[player.id];
      const displayName = profile?.name || `P${index + 1}`;
      const nameText = new Text({
        text: displayName,
        style: { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' }
      });
      nameText.x = 10;
      nameText.y = 6;
      indicator.addChild(nameText);

      // Bet/Wins combined label
      const hasBet = player.bet !== null;
      let bottomLabel = '';
      if (isBettingPhase) {
        bottomLabel = hasBet ? `Bet: ${player.bet}` : 'Waiting';
      } else {
        bottomLabel = `Bet: ${player.bet ?? '-'} | Won: ${player.handsWon}`;
      }
      const bottomText = new Text({
        text: bottomLabel,
        style: {
          fontSize: sizes.smallFontSize,
          fill: 0xffffff
        }
      });
      bottomText.x = 10;
      bottomText.y = isMobile ? 36 : 42;
      indicator.addChild(bottomText);

      indicator.x = currentX;
      indicator.y = currentY;
      this.addChild(indicator);

      currentX += indicatorWidth + Xspacing;
    });
  }
}
