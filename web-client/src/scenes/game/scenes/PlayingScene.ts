import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes, getCardDimensions, getMesaCardDimensions } from '../../../utils/responsive';
import { GamePlayerIndicators } from '../components/GamePlayerIndicators';
import { RoundTitle } from '../components/RoundTitle';
import { PlayerHand } from '../components/player-hand/PlayerHand';
import { TableCards } from '../components/TableCards';
import { HandCompletePanel } from '../components/HandCompletePanel';
import { Card } from '../components/Card';
import { isMyTurn } from '../../../utils/gameHelpers';

export class PlayingScene extends Container {
  private bg: Graphics;
  private tableBackground: Graphics;
  private mesaContainer: Container;
  private mesaCardComponent: Card | null = null;
  private roundTitle: RoundTitle;
  private playerIndicators: GamePlayerIndicators;
  private tableCards: TableCards;
  private playerHand: PlayerHand | null = null;
  private handCompletePanel: HandCompletePanel | null = null;

  private resizeHandler: () => void;

  constructor(
    gameState: GameState,
    myPlayerId: string,
    playerNames: Record<string, { name: string }>,
    onContinue: () => void
  ) {
    super();

    const isHandComplete = gameState.status === 'hand_complete';
    const lastHand = gameState.currentRound?.completedHands[
      (gameState.currentRound.completedHands.length - 1)
    ];
    const winnerId = isHandComplete ? lastHand?.winnerId : undefined;

    this.bg = new Graphics();
    this.tableBackground = new Graphics();
    this.mesaContainer = new Container();
    this.roundTitle = new RoundTitle();
    this.playerIndicators = new GamePlayerIndicators('playing');
    this.tableCards = new TableCards(gameState, winnerId);

    // Mesa card — compact landscape mode, "Mesa" label rendered inside the card
    if (gameState.currentRound?.mesa) {
      const mesaDims = getMesaCardDimensions();
      this.mesaCardComponent = new Card(gameState.currentRound.mesa, mesaDims.width, mesaDims.height, true);
      this.mesaContainer.addChild(this.mesaCardComponent);
    }

    if (!isHandComplete) {
      this.playerHand = new PlayerHand(gameState, myPlayerId);
    } else if (lastHand) {
      const winnerIndex = gameState.players.findIndex(p => p.id === lastHand.winnerId);
      const profile = playerNames[lastHand.winnerId];
      const winnerLabel = profile?.name || `Player ${winnerIndex + 1}`;
      const playersReady: string[] = (gameState.currentRound?.currentHand as any)?.playersReady ?? [];
      this.handCompletePanel = new HandCompletePanel(
        winnerLabel,
        playersReady.length,
        gameState.players.length,
        playersReady.includes(myPlayerId),
        onContinue
      );
    }

    this.roundTitle.updateFromState(gameState);
    this.playerIndicators.update(gameState, playerNames);
    this.buildChildren();
    this.layout();

    this.resizeHandler = () => this.layout();
    window.addEventListener('resize', this.resizeHandler);
  }

  private buildChildren(): void {
    this.addChild(this.bg);
    this.addChild(this.tableBackground);
    this.addChild(this.roundTitle);
    this.addChild(this.playerIndicators);
    this.addChild(this.mesaContainer);
    this.addChild(this.tableCards);
    if (this.playerHand) this.addChild(this.playerHand);
    if (this.handCompletePanel) this.addChild(this.handCompletePanel);
  }

  private layout(): void {
    const sizes = getResponsiveSizes();
    const cardDims = getCardDimensions();
    const sp = sizes.spacing;
    const pad = sizes.padding;

    this.bg.clear();
    this.bg.rect(0, 0, sizes.width, sizes.height).fill(0x1a1a2e);

    let y = pad;

    // Round title
    this.roundTitle.x = sp;
    this.roundTitle.y = y;
    y += this.roundTitle.height + pad;

    // Player indicators
    this.playerIndicators.x = 0;
    this.playerIndicators.y = y;
    y += this.playerIndicators.height + sp;

    // --- TABLE AREA ---
    const tableAreaTop = y;
    const mesaDims = getMesaCardDimensions();

    this.mesaContainer.x = sp;
    this.mesaContainer.y = tableAreaTop;

    // Played cards start below the mesa card row
    const tableCardsTop = tableAreaTop + mesaDims.height + pad;
    const tableCardsWidth = sizes.width - sp * 4;
    this.tableCards.layout(sp * 2, tableCardsTop, tableCardsWidth);

    // Table background spans the full table area (mesa row + 2 card rows)
    const tableAreaBottom = tableCardsTop + 2 * (cardDims.height + cardDims.margin);
    this.tableBackground.clear();
    this.tableBackground.roundRect(
      pad,
      tableAreaTop - pad,
      sizes.width - sp,
      tableAreaBottom - tableAreaTop + sp,
      12
    );
    this.tableBackground.fill(0x0f3d3e);
    this.tableBackground.stroke({ width: 2, color: 0x2a9d8f });

    y = tableAreaBottom + sp;

    // --- HAND AREA ---
    if (this.playerHand) {
      this.playerHand.x = 0;
      this.playerHand.y = y;
      this.playerHand.layout(sizes.width);
    }

    if (this.handCompletePanel) {
      this.handCompletePanel.x = 0;
      this.handCompletePanel.y = y;
      this.handCompletePanel.layout(sizes.width);
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    window.removeEventListener('resize', this.resizeHandler);
    super.destroy(options);
  }
}
