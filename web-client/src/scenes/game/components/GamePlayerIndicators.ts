import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes } from '../../../utils/responsive';

export type IndicatorMode = 'betting' | 'playing';

export class GamePlayerIndicators extends Container {
  private gameState: GameState | null = null;
  private myPlayerId: string = '';
  private playerNames: Record<string, { name: string; shorthand: string }> = {};
  private mode: IndicatorMode;

  constructor(mode: IndicatorMode = 'playing') {
    super();
    this.mode = mode;
  }

  update(gameState: GameState, myPlayerId: string, playerNames: Record<string, { name: string; shorthand: string }> = {}): void {
    this.gameState = gameState;
    this.myPlayerId = myPlayerId;
    this.playerNames = playerNames;
    this.render();
  }

  private render(): void {
    this.removeChildren();
    if (!this.gameState?.currentRound) return;

    const sizes = getResponsiveSizes();
    const players = this.gameState.players;
    const isBetting = this.mode === 'betting';

    // Determine current player based on mode
    let currentPlayerId: string | null = null;
    if (isBetting) {
      const { bettingOrder, currentBettingIndex } = this.gameState.currentRound;
      currentPlayerId = bettingOrder[currentBettingIndex] ?? null;
    } else {
      const currentHand = this.gameState.currentRound.currentHand;
      currentPlayerId = currentHand ? currentHand.handOrder[currentHand.currentPlayerIndex] : null;
    }

    const indicatorWidth = sizes.isMobile ? (isBetting ? 140 : 110) : (isBetting ? 160 : 130);
    const indicatorHeight = sizes.isMobile ? (isBetting ? 44 : 56) : (isBetting ? 50 : 66);
    const spacing = 10;

    const availableWidth = sizes.width - (sizes.spacing * 2);
    const indicatorsPerRow = Math.floor((availableWidth + spacing) / (indicatorWidth + spacing));

    let currentX = sizes.spacing;
    let currentY = sizes.spacing;
    let currentRow = 0;

    players.forEach((player, index) => {
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

      // Player name
      const profile = this.playerNames[player.id];
      const displayName = profile?.name || player.shorthand || `P${index + 1}`;
      const nameText = new Text({
        text: displayName,
        style: { fontSize: sizes.isMobile ? 16 : 18, fill: 0xffffff, fontWeight: 'bold' }
      });
      nameText.x = 10;
      nameText.y = 6;
      indicator.addChild(nameText);

      // Bet text
      const hasBet = player.bet !== null;
      const betLabel = isBetting
        ? (hasBet ? `Bet: ${player.bet}` : '...')
        : `Bet: ${player.bet ?? '-'}`;
      const betText = new Text({
        text: betLabel,
        style: {
          fontSize: sizes.isMobile ? 14 : 15,
          fill: 0xffffff
        }
      });
      betText.x = 10;
      betText.y = sizes.isMobile ? 26 : 28;
      indicator.addChild(betText);

      // Wins (playing mode only)
      if (!isBetting) {
        const winsText = new Text({
          text: `Won: ${player.handsWon}`,
          style: { fontSize: sizes.isMobile ? 14 : 15, fill: 0xffffff }
        });
        winsText.x = 10;
        winsText.y = sizes.isMobile ? 40 : 46;
        indicator.addChild(winsText);
      }

      indicator.x = currentX;
      indicator.y = currentY;
      this.addChild(indicator);

      currentX += indicatorWidth + spacing;
    });
  }
}
