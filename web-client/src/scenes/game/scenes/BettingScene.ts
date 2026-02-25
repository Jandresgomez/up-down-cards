import { Container, Graphics, Text } from 'pixi.js';
import { GameState, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';
import { getResponsiveSizes, isMobile, getCardDimensions } from '../../../utils/responsive';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getMyHand } from '../../../utils/gameHelpers';

export class BettingScene extends Container {
  private gameState: GameState;
  private myPlayerId: string;
  private validBets: number[];
  private maxBet: number;
  private isMyTurn: boolean;
  private onConfirm: (bet: number) => void;

  private currentBet: number = 0;
  private betText: Text;
  private warningText: Text;
  private bettingPanel: Container;

  constructor(
    gameState: GameState,
    myPlayerId: string,
    validBets: number[],
    maxBet: number,
    isMyTurn: boolean,
    onConfirm: (bet: number) => void
  ) {
    super();
    this.gameState = gameState;
    this.myPlayerId = myPlayerId;
    this.validBets = validBets;
    this.maxBet = maxBet;
    this.isMyTurn = isMyTurn;
    this.onConfirm = onConfirm;

    this.bettingPanel = new Container();
    this.betText = new Text({ text: '0', style: { fontSize: 48, fill: 0x4caf50, fontWeight: 'bold' } });
    this.warningText = new Text({ text: '', style: { fontSize: 16, fill: 0xff6b6b } });

    this.createUI();
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  private createUI(): void {
    const sizes = getResponsiveSizes();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, sizes.width, sizes.height);
    bg.fill(0x1a1a2e);
    this.addChild(bg);

    let currentY = sizes.spacing;

    // Player indicators at top (4xN grid, centered)
    const topHeight = sizes.height * 0.25;
    this.renderPlayerIndicators(currentY, topHeight);
    currentY += topHeight + sizes.spacing;

    // Betting controls (center) with mesa inside
    const betPanelHeight = sizes.isMobile ? 180 : 200;
    this.renderBettingControls();
    this.bettingPanel.x = sizes.width / 2;
    this.bettingPanel.y = currentY + betPanelHeight / 2;
    currentY += betPanelHeight + sizes.spacing;

    // Hand (bottom)
    this.renderHand(currentY);
  }

  private renderMesaCard(startY: number, areaHeight: number): void {
    if (!this.gameState.currentRound?.mesa) return;

    const mesa = this.gameState.currentRound.mesa;
    const sizes = getResponsiveSizes();
    const mobile = isMobile();
    const cardWidth = mobile ? 50 : 60;
    const cardHeight = mobile ? 44 : 54;

    const mesaContainer = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, cardWidth, cardHeight, 8);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    mesaContainer.addChild(bg);

    const label = new Text({
      text: 'Mesa',
      style: { fontSize: mobile ? 12 : 14, fill: 0x666666, fontWeight: 'bold' }
    });
    label.x = 6;
    label.y = 6;
    mesaContainer.addChild(label);

    const cardText = new Text({
      text: `${mesa.rank}${SUIT_SYMBOLS[mesa.suit]}`,
      style: { fontSize: mobile ? 20 : 24, fill: SUIT_COLORS[mesa.suit], fontWeight: 'bold' }
    });
    cardText.x = 6;
    cardText.y = mobile ? 20 : 24;
    mesaContainer.addChild(cardText);

    // Position on left side
    mesaContainer.x = sizes.spacing;
    mesaContainer.y = startY + (areaHeight - cardHeight) / 2;
    this.addChild(mesaContainer);
  }

  private renderPlayerIndicators(startY: number, areaHeight: number): void {
    if (!this.gameState.currentRound) return;

    const { bettingOrder, currentBettingIndex } = this.gameState.currentRound;
    const sizes = getResponsiveSizes();

    const indicatorWidth = sizes.isMobile ? 140 : 160;
    const indicatorHeight = sizes.isMobile ? 40 : 45;
    const spacing = 10;
    const maxRows = 4; // Changed from 3 to 4

    // Calculate grid dimensions
    const numPlayers = bettingOrder.length;
    const numCols = Math.ceil(numPlayers / maxRows);

    // Center the grid
    const gridWidth = numCols * (indicatorWidth + spacing) - spacing;
    const startX = (sizes.width - gridWidth) / 2;

    bettingOrder.forEach((playerId, index) => {
      const player = this.gameState.players.find(p => p.id === playerId);
      if (!player) return;

      const col = Math.floor(index / maxRows);
      const row = index % maxRows;

      const indicator = new Container();
      const isCurrentPlayer = index === currentBettingIndex;
      const hasBet = player.bet !== null;

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, indicatorWidth, indicatorHeight, 8);
      bg.fill(isCurrentPlayer ? 0x4caf50 : 0x2a2a3e);
      bg.stroke({ width: 2, color: isCurrentPlayer ? 0x66ff66 : 0x4a4a5e });
      indicator.addChild(bg);

      // Player name
      const nameText = new Text({
        text: playerId === this.myPlayerId ? 'You' : `Player ${index + 1}`,
        style: { fontSize: sizes.isMobile ? 14 : 16, fill: 0xffffff, fontWeight: 'bold' }
      });
      nameText.x = 10;
      nameText.y = sizes.isMobile ? 5 : 7;
      indicator.addChild(nameText);

      // Bet display
      const betText = new Text({
        text: hasBet ? `Bet: ${player.bet}` : '...',
        style: { fontSize: sizes.isMobile ? 12 : 14, fill: hasBet ? 0x4caf50 : 0x888888 }
      });
      betText.x = 10;
      betText.y = sizes.isMobile ? 22 : 25;
      indicator.addChild(betText);

      indicator.x = startX + col * (indicatorWidth + spacing);
      indicator.y = startY + row * (indicatorHeight + spacing);
      this.addChild(indicator);
    });
  }

  private renderHand(startY: number): void {
    const myHand = getMyHand(this.gameState, this.myPlayerId);
    if (!myHand || myHand.length === 0) return;

    const sizes = getResponsiveSizes();
    const cardDims = getCardDimensions();
    const cardSpacing = cardDims.width + cardDims.margin;
    const startX = (sizes.width - (myHand.length * cardSpacing)) / 2;

    myHand.forEach((card, index) => {
      const cardComponent = new Card(card, cardDims.width, cardDims.height);
      cardComponent.x = startX + index * cardSpacing;
      cardComponent.y = startY;
      this.addChild(cardComponent);
    });
  }

  private renderBettingControls(): void {
    const sizes = getResponsiveSizes();
    const panelWidth = Math.min(300, sizes.width * 0.8);
    const panelHeight = sizes.isMobile ? 180 : 200;

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, panelWidth, panelHeight, 15);
    bg.fill(0x1a1a2e);
    bg.stroke({ width: 3, color: this.isMyTurn ? 0x4caf50 : 0x666666 });
    this.bettingPanel.addChild(bg);

    // Mesa card (top-left corner of panel)
    this.renderMesaInPanel(panelWidth);

    // Title
    const title = new Text({
      text: this.isMyTurn ? 'Your Bet' : 'Waiting...',
      style: { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = panelWidth / 2;
    title.y = sizes.spacing * 0.8;
    this.bettingPanel.addChild(title);

    if (!this.isMyTurn) {
      // Show waiting message
      const waitingText = new Text({
        text: 'Others are betting,\nplease wait for your turn!',
        style: { fontSize: sizes.smallFontSize, fill: 0xaaaaaa, align: 'center' }
      });
      waitingText.anchor.set(0.5);
      waitingText.x = panelWidth / 2;
      waitingText.y = panelHeight / 2;
      this.bettingPanel.addChild(waitingText);
    } else {
      // Show betting controls
      // Bet display
      this.betText.anchor.set(0.5);
      this.betText.x = panelWidth / 2;
      this.betText.y = sizes.isMobile ? 70 : 80;
      this.bettingPanel.addChild(this.betText);

      // Buttons
      const btnY = sizes.isMobile ? 110 : 120;
      const btnSize = sizes.buttonSmall.width;
      const confirmWidth = 120;
      const spacing = 10;
      const totalWidth = btnSize + spacing + confirmWidth + spacing + btnSize;
      const startX = (panelWidth - totalWidth) / 2;

      const decreaseBtn = new Button('-', btnSize, btnSize);
      decreaseBtn.x = startX;
      decreaseBtn.y = btnY;
      decreaseBtn.on('pointerdown', () => this.changeBet(-1));
      this.bettingPanel.addChild(decreaseBtn);

      const confirmBtn = new Button('Confirm', confirmWidth, sizes.buttonSmall.height, 0x4caf50);
      confirmBtn.x = startX + btnSize + spacing;
      confirmBtn.y = btnY;
      confirmBtn.on('pointerdown', () => this.confirm());
      this.bettingPanel.addChild(confirmBtn);

      const increaseBtn = new Button('+', btnSize, btnSize);
      increaseBtn.x = startX + btnSize + spacing + confirmWidth + spacing;
      increaseBtn.y = btnY;
      increaseBtn.on('pointerdown', () => this.changeBet(1));
      this.bettingPanel.addChild(increaseBtn);

      // Warning text
      this.warningText.anchor.set(0.5);
      this.warningText.x = panelWidth / 2;
      this.warningText.y = btnY + sizes.buttonSmall.height + 15;
      this.bettingPanel.addChild(this.warningText);

      this.updateWarning();
    }

    // Position panel
    this.bettingPanel.pivot.set(panelWidth / 2, panelHeight / 2);
    this.addChild(this.bettingPanel);
  }

  private renderMesaInPanel(panelWidth: number): void {
    if (!this.gameState.currentRound?.mesa) return;

    const mesa = this.gameState.currentRound.mesa;
    const mobile = isMobile();
    const cardWidth = mobile ? 50 : 65;
    const cardHeight = mobile ? 44 : 58;

    const mesaContainer = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, cardWidth, cardHeight, 6);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    mesaContainer.addChild(bg);

    const label = new Text({
      text: 'Mesa',
      style: { fontSize: mobile ? 11 : 14, fill: 0x666666, fontWeight: 'bold' }
    });
    label.x = 5;
    label.y = 5;
    mesaContainer.addChild(label);

    const cardText = new Text({
      text: `${mesa.rank}${SUIT_SYMBOLS[mesa.suit]}`,
      style: { fontSize: mobile ? 20 : 26, fill: SUIT_COLORS[mesa.suit], fontWeight: 'bold' }
    });
    cardText.x = 5;
    cardText.y = mobile ? 20 : 26;
    mesaContainer.addChild(cardText);

    // Position at top-left of panel
    mesaContainer.x = 10;
    mesaContainer.y = 10;
    this.bettingPanel.addChild(mesaContainer);
  }

  private resize(): void {
    const sizes = getResponsiveSizes();

    // Recalculate layout positions
    let currentY = sizes.spacing;

    // Top section height
    const topHeight = sizes.height * 0.25;
    currentY += topHeight + sizes.spacing;

    // Betting panel position
    const betPanelHeight = sizes.isMobile ? 180 : 200;
    this.bettingPanel.x = sizes.width / 2;
    this.bettingPanel.y = currentY + betPanelHeight / 2;
  }

  private changeBet(delta: number): void {
    const newBet = this.currentBet + delta;

    if (newBet < 0) {
      this.currentBet = this.maxBet;
    } else if (newBet > this.maxBet) {
      this.currentBet = 0;
    } else {
      this.currentBet = newBet;
    }

    this.betText.text = `${this.currentBet}`;
    this.updateWarning();
  }

  private updateWarning(): void {
    if (!this.validBets.includes(this.currentBet)) {
      this.warningText.text = `Invalid! Valid: ${this.validBets.join(', ')}`;
    } else {
      this.warningText.text = '';
    }
  }

  private confirm(): void {
    if (this.validBets.includes(this.currentBet)) {
      this.onConfirm(this.currentBet);
    } else {
      this.shake();
    }
  }

  private shake(): void {
    const originalRotation = this.bettingPanel.rotation;
    const shakeAngle = (5 * Math.PI) / 180;
    const shakeDuration = 50;
    const shakes = 3;

    let currentShake = 0;
    const shakeInterval = setInterval(() => {
      if (currentShake >= shakes * 2) {
        this.bettingPanel.rotation = originalRotation;
        clearInterval(shakeInterval);
        return;
      }

      this.bettingPanel.rotation = originalRotation + (currentShake % 2 === 0 ? shakeAngle : -shakeAngle);
      currentShake++;
    }, shakeDuration);
  }
}
