import { Container, Graphics, isMobile, Text, v8_0_0 } from 'pixi.js';
import { BG_PLAYER_ACTIVE, BG_PLAYER_IDLE, STROKE_ACTIVE, STROKE_IDLE, TEXT_PRIMARY, BG_OVERLAY } from '../../../../utils/colors';
import { getResponsiveSizes } from '../../../../utils/responsive';
import { GameState } from '../../../../types/game-types';
import { PLAYER_COLORS } from '../../../../utils/colors';

const PLAYER_CIRCLE_RADIUS = (isMobile: boolean) => isMobile ? 28 : 32;
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


    const indicatorHeight = sizes.isMobile ? 72 : 90;
    const indicatorCompactHeight = indicatorHeight / 2;
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
        currentY = currentRow * (indicatorCompactHeight + sizes.spacing);
      }

      const indicator = new Container();
      const isCurrentPlayer = player.id === currentPlayerId;

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, indicatorWidth, indicatorCompactHeight, 8);
      bg.fill(isCurrentPlayer ? BG_PLAYER_ACTIVE : BG_PLAYER_IDLE);
      bg.stroke({ width: 2, color: isCurrentPlayer ? STROKE_ACTIVE : STROKE_IDLE });
      indicator.addChild(bg);

      // Player name
      const profile = this.playerNames[player.id];
      const displayName = profile?.name || `P${index + 1}`;
      const nameText = new Text({
        text: displayName,
        style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY, fontWeight: 'bold' }
      });
      nameText.x = 6;
      nameText.y = 6;
      nameText.anchor.set(0, 0);
      indicator.addChild(nameText);

      const playerTurnNumber = (this.gameState?.currentRound?.currentHand?.handOrder.findIndex(id => id === player.id)) ?? undefined;
      const playerColor = new Graphics();
      playerColor
        .roundRect(0, 0, PLAYER_CIRCLE_RADIUS(sizes.isMobile) * 1.2, PLAYER_CIRCLE_RADIUS(sizes.isMobile), 8)
        .fill(PLAYER_COLORS[player.naturalOrder % PLAYER_COLORS.length]);
      playerColor.x = indicatorWidth - (playerColor.width + 4);
      playerColor.y = 4;

      if (typeof playerTurnNumber === 'number') {
        const playerNumber = new Text({
          text: `${playerTurnNumber + 1}`,
          style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY }
        });
        playerNumber.x = playerColor.x + PLAYER_CIRCLE_RADIUS(sizes.isMobile) + 4;
        playerNumber.y = playerColor.y - playerNumber.height / 2;
        indicator.addChild(playerNumber);
      }
      indicator.addChild(playerColor);


      // Bet/Wins combined label
      // const hasBet = player.bet !== null;
      // let bottomLabel = '';
      // if (isBettingPhase) {
      //   bottomLabel = hasBet ? `Bet: ${player.bet}` : 'Waiting';
      // } else {
      //   bottomLabel = `Bet: ${player.bet ?? '-'} | Won: ${player.handsWon}`;
      // }
      // const bottomText = new Text({
      //   text: bottomLabel,
      //   style: {
      //     fontSize: sizes.smallFontSize,
      //     fill: TEXT_PRIMARY
      //   }
      // });
      // bottomText.x = 10;
      // bottomText.y = isMobile ? 36 : 42;
      // indicator.addChild(bottomText);

      indicator.x = currentX;
      indicator.y = currentY;
      this.addChild(indicator);

      currentX += indicatorWidth + Xspacing;
    });

    if (indicatorsPerRow >= players.length) {
      // add a fake extra row to compensate for only having one indicators row
      const extraRowY = (currentRow + 1) * (indicatorHeight + sizes.spacing);
      const extraRow = new Graphics();
      extraRow.rect(0, 0, sizes.width, indicatorHeight).fill(BG_OVERLAY, 0).stroke({ width: 0, color: BG_OVERLAY });
      extraRow.x = 0;
      extraRow.y = extraRowY;
      this.addChild(extraRow);
    }
  }
}
