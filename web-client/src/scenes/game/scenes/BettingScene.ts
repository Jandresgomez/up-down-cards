import { Container, Graphics } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes, getCardDimensions } from '../../../utils/responsive';
import { Card } from '../components/Card';
import { GamePlayerIndicators } from '../components/GamePlayerIndicators';
import { RoundTitle } from '../components/RoundTitle';
import { BettingControls } from '../components/BettingControls';
import { getMyHand } from '../../../utils/gameHelpers';

export class BettingScene extends Container {
  private bg: Graphics;
  private roundTitle: RoundTitle;
  private playerIndicators: GamePlayerIndicators;
  private bettingControls: BettingControls;
  private handContainer: Container;
  private handCards: Card[] = [];

  private resizeHandler: () => void;

  constructor(
    gameState: GameState,
    myPlayerId: string,
    validBets: number[],
    maxBet: number,
    isMyTurn: boolean,
    onConfirm: (bet: number) => void,
    playerNames: Record<string, { name: string }> = {}
  ) {
    super();

    this.bg = new Graphics();
    this.roundTitle = new RoundTitle();
    this.playerIndicators = new GamePlayerIndicators('betting');
    this.bettingControls = new BettingControls(
      isMyTurn,
      validBets,
      maxBet,
      gameState.currentRound?.mesa ?? null,
      onConfirm
    );
    this.handContainer = new Container();

    this.roundTitle.updateFromState(gameState);
    this.playerIndicators.update(gameState, playerNames);
    this.buildHand(gameState, myPlayerId);

    this.buildChildren();
    this.layout();

    this.resizeHandler = () => this.layout();
    window.addEventListener('resize', this.resizeHandler);
  }

  private buildChildren(): void {
    this.addChild(this.bg);
    this.addChild(this.roundTitle);
    this.addChild(this.playerIndicators);
    this.addChild(this.bettingControls);
    this.addChild(this.handContainer);
  }

  private buildHand(gameState: GameState, myPlayerId: string): void {
    const myHand = getMyHand(gameState, myPlayerId);
    if (!myHand) return;

    const cardDims = getCardDimensions();
    this.handCards = myHand.map(card => {
      const c = new Card(card, cardDims.width, cardDims.height);
      this.handContainer.addChild(c);
      return c;
    });
  }

  private layout(): void {
    const sizes = getResponsiveSizes();
    const cardDims = getCardDimensions();
    const sp = sizes.spacing;
    const pad = Math.floor(sp / 2);

    this.bg.clear();
    this.bg.rect(0, 0, sizes.width, sizes.height).fill(0x1a1a2e);

    let y = pad;

    this.roundTitle.x = sp;
    this.roundTitle.y = y;
    y += this.roundTitle.height + pad;

    this.playerIndicators.x = 0;
    this.playerIndicators.y = y;
    y += this.playerIndicators.height + pad;

    const panelWidth = sizes.width - sp * 2;
    this.bettingControls.x = sp;
    this.bettingControls.y = y;
    this.bettingControls.layout(panelWidth);
    y += this.bettingControls.height + pad;

    // Hand cards — 2-row layout
    const cardSpacing = cardDims.width + cardDims.margin;
    const lineSize = Math.max(1, Math.floor(sizes.width / cardSpacing));
    const numRows = Math.ceil(this.handCards.length / lineSize);

    this.handContainer.x = 0;
    this.handContainer.y = y;

    for (let row = 0; row < numRows; row++) {
      const rowStart = row * lineSize;
      const rowEnd = Math.min(rowStart + lineSize, this.handCards.length);
      const cardsInRow = rowEnd - rowStart;
      const rowWidth = cardsInRow * cardSpacing - cardDims.margin;
      const startX = (sizes.width - rowWidth) / 2;

      for (let col = 0; col < cardsInRow; col++) {
        this.handCards[rowStart + col].x = startX + col * cardSpacing;
        this.handCards[rowStart + col].y = row * (cardDims.height + cardDims.margin);
      }
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    window.removeEventListener('resize', this.resizeHandler);
    super.destroy(options);
  }
}
