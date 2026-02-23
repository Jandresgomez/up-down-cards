import { Container, Graphics, Text } from 'pixi.js';
import { GameState, Card, SUIT_SYMBOLS, SUIT_COLORS } from '../types/game-types';
import { getPlayerId } from '../utils/playerId';
import {
  isMyTurn,
  getMyHand,
  canPlayCard,
  getValidBets,
  getMesaSuit,
  getPintaSuit,
  getMyPlayer
} from '../utils/gameHelpers';
import { placeBet, playCard, continueGame } from '../api/api';

export class GameScreen {
  private container: Container;
  private table: Graphics;
  private handContainer: Container;
  private tableCardsContainer: Container;
  private infoContainer: Container;
  private bettingContainer: Container | null = null;
  private winnerOverlay: Container | null = null;
  private roundCompleteOverlay: Container | null = null;
  private gameCompleteOverlay: Container | null = null;
  private gameState: GameState | null = null;
  private myPlayerId: string;

  constructor(roomId: string) {
    this.container = new Container();
    this.table = new Graphics();
    this.handContainer = new Container();
    this.tableCardsContainer = new Container();
    this.infoContainer = new Container();
    this.myPlayerId = getPlayerId();

    this.createUI();
  }

  private createUI(): void {
    this.container.addChild(this.table);
    this.container.addChild(this.infoContainer);
    this.container.addChild(this.tableCardsContainer);
    this.container.addChild(this.handContainer);
    this.resizeGame();
  }

  resizeGame(): void {
    // Table
    this.table.clear();
    this.table.roundRect(100, 100, window.innerWidth - 200, window.innerHeight - 300, 20);
    this.table.fill(0x0f3d3e);
    this.table.stroke({ width: 3, color: 0x2a9d8f });

    // Hand position
    this.handContainer.x = (window.innerWidth - 600) / 2;
    this.handContainer.y = window.innerHeight - 180;

    // Table cards position
    this.tableCardsContainer.x = window.innerWidth / 2;
    this.tableCardsContainer.y = window.innerHeight / 2;

    // Info position
    this.infoContainer.x = 20;
    this.infoContainer.y = 20;
  }

  updateGameState(gameState: GameState): void {
    const previousStatus = this.gameState?.status;
    console.log('updating game state', gameState, this.gameState)
    this.gameState = gameState;

    // Detect hand_complete transition
    if (gameState.status === 'hand_complete' && previousStatus !== 'hand_complete') {
      this.showWinnerOverlay();
    }

    // Update overlay if still in hand_complete (ready list changed)
    if (gameState.status === 'hand_complete' && this.winnerOverlay) {
      this.hideWinnerOverlay();
      this.showWinnerOverlay();
    }

    // Hide overlay if status changes away from hand_complete
    if (gameState.status !== 'hand_complete' && this.winnerOverlay) {
      this.hideWinnerOverlay();
    }

    // Detect round_complete transition
    if (gameState.status === 'round_complete' && previousStatus !== 'round_complete') {
      this.showRoundCompleteOverlay();
    }

    // Update overlay if still in round_complete (ready list changed)
    if (gameState.status === 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
      this.showRoundCompleteOverlay();
    }

    // Hide overlay if status changes away from round_complete
    if (gameState.status !== 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
    }

    // Detect game_complete transition
    if (gameState.status === 'game_complete' && previousStatus !== 'game_complete') {
      this.showGameCompleteOverlay();
    }

    this.render();
  }

  private render(): void {
    if (!this.gameState) return;

    this.renderInfo();
    this.renderHand();
    this.renderTableCards();
    this.renderBettingUI();
  }

  private renderInfo(): void {
    if (!this.gameState) return;

    this.infoContainer.removeChildren();

    const myPlayer = getMyPlayer(this.gameState, this.myPlayerId);
    if (!myPlayer) return;

    const lines: string[] = [];

    // Room and status
    lines.push(`Room: ${this.gameState.id}`);
    lines.push(`Status: ${this.gameState.status}`);

    // Round info
    if (this.gameState.currentRound) {
      const { roundNumber, cardsPerPlayer, mesa } = this.gameState.currentRound;
      lines.push(`Round: ${roundNumber} (${cardsPerPlayer} cards)`);
      lines.push(`Mesa: ${mesa.rank}${SUIT_SYMBOLS[mesa.suit]}`);

      const pinta = getPintaSuit(this.gameState);
      if (pinta) {
        lines.push(`Pinta: ${SUIT_SYMBOLS[pinta]}`);
      }
    }

    // Player info
    lines.push('');
    lines.push(`Your Score: ${myPlayer.totalScore}`);
    if (myPlayer.bet !== null) {
      lines.push(`Your Bet: ${myPlayer.bet}`);
      lines.push(`Hands Won: ${myPlayer.handsWon}`);
    }

    // Turn indicator
    if (isMyTurn(this.gameState, this.myPlayerId)) {
      lines.push('');
      lines.push('>>> YOUR TURN <<<');
    }

    const text = new Text({
      text: lines.join('\n'),
      style: { fontSize: 20, fill: 0xffffff, lineHeight: 28 }
    });
    this.infoContainer.addChild(text);
  }

  private renderHand(): void {
    if (!this.gameState) return;

    this.handContainer.removeChildren();
    const hand = getMyHand(this.gameState, this.myPlayerId);

    hand.forEach((card, index) => {
      const cardContainer = this.createCardVisual(card);
      cardContainer.x = index * 120;

      const canPlay = this.gameState!.status === 'playing_hand' &&
        isMyTurn(this.gameState!, this.myPlayerId) &&
        canPlayCard(this.gameState!, this.myPlayerId, card);

      if (canPlay) {
        cardContainer.eventMode = 'static';
        cardContainer.cursor = 'pointer';

        cardContainer.on('pointerover', () => {
          cardContainer.y = -20;
        });

        cardContainer.on('pointerout', () => {
          cardContainer.y = 0;
        });

        cardContainer.on('pointerdown', () => this.handlePlayCard(card));
      } else {
        cardContainer.alpha = 0.6;
      }

      this.handContainer.addChild(cardContainer);
    });
  }

  private renderTableCards(): void {
    if (!this.gameState?.currentRound?.currentHand) {
      this.tableCardsContainer.removeChildren();
      return;
    }

    this.tableCardsContainer.removeChildren();
    const { cardsPlayed } = this.gameState.currentRound.currentHand;

    cardsPlayed.forEach((played, index) => {
      const cardContainer = this.createCardVisual(played.card);

      // Arrange in circle
      const angle = (index / cardsPlayed.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 150;
      cardContainer.x = Math.cos(angle) * radius - 50;
      cardContainer.y = Math.sin(angle) * radius - 70;

      // Player label
      const playerIndex = this.gameState!.players.findIndex(p => p.id === played.playerId);
      const label = new Text({
        text: `P${playerIndex + 1}`,
        style: { fontSize: 16, fill: 0xffffff }
      });
      label.anchor.set(0.5);
      label.x = 50;
      label.y = -20;
      cardContainer.addChild(label);

      this.tableCardsContainer.addChild(cardContainer);
    });
  }

  private renderBettingUI(): void {
    if (this.bettingContainer) {
      this.container.removeChild(this.bettingContainer);
      this.bettingContainer.destroy({ children: true });
      this.bettingContainer = null;
    }

    if (!this.gameState || this.gameState.status !== 'betting') return;
    if (!isMyTurn(this.gameState, this.myPlayerId)) return;

    this.bettingContainer = new Container();
    this.bettingContainer.x = window.innerWidth / 2;
    this.bettingContainer.y = window.innerHeight / 2 - 100;

    const title = new Text({
      text: 'Place Your Bet',
      style: { fontSize: 32, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -80;
    this.bettingContainer.addChild(title);

    const validBets = getValidBets(this.gameState, this.myPlayerId);
    const maxBet = Math.max(...validBets);
    let currentBet = 0;

    // Bet display
    const betDisplay = new Text({
      text: currentBet.toString(),
      style: { fontSize: 64, fill: 0xffffff, fontWeight: 'bold' }
    });
    betDisplay.anchor.set(0.5);
    betDisplay.y = 0;
    this.bettingContainer.addChild(betDisplay);

    // Minus button
    const minusBtn = this.createBetControlButton('-', -120, 0);
    minusBtn.on('pointerdown', () => {
      if (currentBet > 0) {
        currentBet--;
        betDisplay.text = currentBet.toString();
        updateWarning();
      }
    });
    this.bettingContainer.addChild(minusBtn);

    // Plus button
    const plusBtn = this.createBetControlButton('+', 120, 0);
    plusBtn.on('pointerdown', () => {
      if (currentBet < maxBet) {
        currentBet++;
        betDisplay.text = currentBet.toString();
        updateWarning();
      }
    });
    this.bettingContainer.addChild(plusBtn);

    // Confirm button
    const confirmBtn = this.createConfirmButton();
    confirmBtn.y = 80;
    confirmBtn.on('pointerdown', () => {
      if (validBets.includes(currentBet)) {
        this.handlePlaceBet(currentBet);
      }
    });
    this.bettingContainer.addChild(confirmBtn);

    // Invalid bet warning
    const warningText = new Text({
      text: '',
      style: { fontSize: 18, fill: 0xff6b6b }
    });
    warningText.anchor.set(0.5);
    warningText.y = 140;
    this.bettingContainer.addChild(warningText);

    // Update warning when bet changes
    const updateWarning = () => {
      if (!validBets.includes(currentBet)) {
        warningText.text = 'Invalid bet for last player';
      } else {
        warningText.text = '';
      }
    };

    this.container.addChild(this.bettingContainer);
  }

  private createBetControlButton(label: string, x: number, y: number): Container {
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, 80, 80, 12);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 3, color: 0x1a7d6f });
    btn.addChild(bg);

    const text = new Text({
      text: label,
      style: { fontSize: 48, fill: 0xffffff, fontWeight: 'bold' }
    });
    text.anchor.set(0.5);
    text.x = 40;
    text.y = 40;
    btn.addChild(text);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    btn.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 80, 80, 12);
      bg.fill(0x3ab5a3);
      bg.stroke({ width: 3, color: 0x1a7d6f });
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 80, 80, 12);
      bg.fill(0x2a9d8f);
      bg.stroke({ width: 3, color: 0x1a7d6f });
    });

    return btn;
  }

  private createConfirmButton(): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 200, 50, 10);
    bg.fill(0x4caf50);
    bg.stroke({ width: 3, color: 0x388e3c });
    btn.addChild(bg);

    const text = new Text({
      text: 'Confirm Bet',
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    text.anchor.set(0.5);
    text.x = 100;
    text.y = 25;
    btn.addChild(text);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    btn.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 200, 50, 10);
      bg.fill(0x66bb6a);
      bg.stroke({ width: 3, color: 0x388e3c });
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 200, 50, 10);
      bg.fill(0x4caf50);
      bg.stroke({ width: 3, color: 0x388e3c });
    });

    return btn;
  }

  private createBetButton(bet: number): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 60, 60, 8);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 2, color: 0x1a7d6f });
    btn.addChild(bg);

    const label = new Text({
      text: bet.toString(),
      style: { fontSize: 28, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = 30;
    label.y = 30;
    btn.addChild(label);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    btn.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 60, 60, 8);
      bg.fill(0x3ab5a3);
      bg.stroke({ width: 2, color: 0x1a7d6f });
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 60, 60, 8);
      bg.fill(0x2a9d8f);
      bg.stroke({ width: 2, color: 0x1a7d6f });
    });

    btn.on('pointerdown', () => this.handlePlaceBet(bet));

    return btn;
  }

  private createCardVisual(card: Card): Container {
    const cardContainer = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 100, 140, 10);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    cardContainer.addChild(bg);

    const color = SUIT_COLORS[card.suit];
    const symbol = SUIT_SYMBOLS[card.suit];

    const text = new Text({
      text: `${card.rank}\n${symbol}`,
      style: {
        fontSize: 32,
        fill: color,
        fontWeight: 'bold',
        align: 'center'
      }
    });
    text.anchor.set(0.5);
    text.x = 50;
    text.y = 70;
    cardContainer.addChild(text);

    return cardContainer;
  }

  private async handlePlaceBet(bet: number): Promise<void> {
    try {
      const result = await placeBet(bet);
      if (!result.success) {
        console.error('Failed to place bet:', result.error);
      }
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  }

  private async handlePlayCard(card: Card): Promise<void> {
    try {
      const result = await playCard(card);
      if (!result.success) {
        console.error('Failed to play card:', result.error);
      }
    } catch (error) {
      console.error('Error playing card:', error);
    }
  }

  private showWinnerOverlay(): void {
    console.log('showWinnerOverlay called', this.gameState?.currentRound);
    if (!this.gameState?.currentRound) {
      console.log('No current round');
      return;
    }

    const lastHand = this.gameState.currentRound.completedHands[
      this.gameState.currentRound.completedHands.length - 1
    ];

    if (!lastHand) {
      console.log('No completed hands', this.gameState.currentRound.completedHands);
      return;
    }

    this.winnerOverlay = new Container();

    // Semi-transparent background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.winnerOverlay.addChild(bg);

    // Winner panel
    const panel = new Container();
    panel.x = window.innerWidth / 2;
    panel.y = window.innerHeight / 2;

    const panelBg = new Graphics();
    panelBg.roundRect(-300, -300, 600, 600, 20);
    panelBg.fill(0x1a1a2e);
    panelBg.stroke({ width: 4, color: 0xffd700 });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Hand Winner!',
      style: { fontSize: 48, fill: 0xffd700, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -220;
    panel.addChild(title);

    // Winner info
    const winnerIndex = this.gameState!.players.findIndex(p => p.id === lastHand.winnerId);

    const winnerText = new Text({
      text: `Player ${winnerIndex + 1}`,
      style: { fontSize: 36, fill: 0xffffff, fontWeight: 'bold' }
    });
    winnerText.anchor.set(0.5);
    winnerText.y = -140;
    panel.addChild(winnerText);

    // Winning card
    const cardVisual = this.createCardVisual(lastHand.winningCard);
    cardVisual.x = -50;
    cardVisual.y = -80;
    cardVisual.scale.set(1.5);
    panel.addChild(cardVisual);

    // All played cards
    const cardsTitle = new Text({
      text: 'Cards Played:',
      style: { fontSize: 24, fill: 0xffffff }
    });
    cardsTitle.anchor.set(0.5);
    cardsTitle.y = 80;
    panel.addChild(cardsTitle);

    lastHand.cardsPlayed.forEach((played, index) => {
      const miniCard = this.createCardVisual(played.card);
      miniCard.scale.set(0.6);
      const spacing = 80;
      const totalWidth = lastHand.cardsPlayed.length * spacing;
      miniCard.x = -totalWidth / 2 + index * spacing + 30;
      miniCard.y = 130;

      // Highlight winner's card
      if (played.playerId === lastHand.winnerId) {
        const highlight = new Graphics();
        highlight.roundRect(-5, -5, 110, 150, 12);
        highlight.stroke({ width: 3, color: 0xffd700 });
        miniCard.addChild(highlight);
      }

      panel.addChild(miniCard);
    });

    // Ready status
    const playersReady = this.gameState.currentRound.currentHand?.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${this.gameState.players.length}`,
      style: { fontSize: 20, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.y = 200;
    panel.addChild(readyText);

    // Continue button
    const hasClicked = playersReady.includes(this.myPlayerId);
    const continueBtn = this.createContinueButton(hasClicked);
    continueBtn.y = 240;
    panel.addChild(continueBtn);

    this.winnerOverlay.addChild(panel);
    this.container.addChild(this.winnerOverlay);
  }

  private createContinueButton(hasClicked: boolean): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 200, 50, 10);
    if (hasClicked) {
      bg.fill(0x666666);
      bg.stroke({ width: 3, color: 0x444444 });
    } else {
      bg.fill(0x4caf50);
      bg.stroke({ width: 3, color: 0x388e3c });
    }
    btn.addChild(bg);

    const text = new Text({
      text: hasClicked ? 'Waiting...' : 'Continue',
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    text.anchor.set(0.5);
    text.x = 100;
    text.y = 25;
    btn.addChild(text);

    btn.x = -100;

    if (!hasClicked) {
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      btn.on('pointerover', () => {
        bg.clear();
        bg.roundRect(0, 0, 200, 50, 10);
        bg.fill(0x66bb6a);
        bg.stroke({ width: 3, color: 0x388e3c });
      });

      btn.on('pointerout', () => {
        bg.clear();
        bg.roundRect(0, 0, 200, 50, 10);
        bg.fill(0x4caf50);
        bg.stroke({ width: 3, color: 0x388e3c });
      });

      btn.on('pointerdown', () => this.handleContinue());
    }

    return btn;
  }

  private async handleContinue(): Promise<void> {
    try {
      const result = await continueGame();
      if (!result.success) {
        console.error('Failed to continue:', result.error);
      }
    } catch (error) {
      console.error('Error continuing:', error);
    }
  }

  private hideWinnerOverlay(): void {
    if (this.winnerOverlay) {
      this.container.removeChild(this.winnerOverlay);
      this.winnerOverlay.destroy({ children: true });
      this.winnerOverlay = null;
    }
  }

  private showRoundCompleteOverlay(): void {
    if (!this.gameState?.currentRound) return;

    this.roundCompleteOverlay = new Container();

    // Semi-transparent background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.roundCompleteOverlay.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = window.innerWidth / 2;
    panel.y = window.innerHeight / 2;

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
      text: `Round ${this.gameState.currentRound.roundNumber}`,
      style: { fontSize: 32, fill: 0xffffff }
    });
    roundInfo.anchor.set(0.5);
    roundInfo.y = -180;
    panel.addChild(roundInfo);

    // Scores
    let yPos = -120;
    this.gameState.players.forEach((player, index) => {
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
    const playersReady = this.gameState.currentRound.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${this.gameState.players.length}`,
      style: { fontSize: 20, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.y = yPos + 40;
    panel.addChild(readyText);

    // Continue button
    const hasClicked = playersReady.includes(this.myPlayerId);
    const continueBtn = this.createContinueButton(hasClicked);
    continueBtn.y = yPos + 90;
    panel.addChild(continueBtn);

    this.roundCompleteOverlay.addChild(panel);
    this.container.addChild(this.roundCompleteOverlay);
  }

  private hideRoundCompleteOverlay(): void {
    if (this.roundCompleteOverlay) {
      this.container.removeChild(this.roundCompleteOverlay);
      this.roundCompleteOverlay.destroy({ children: true });
      this.roundCompleteOverlay = null;
    }
  }

  private showGameCompleteOverlay(): void {
    if (!this.gameState) return;

    this.gameCompleteOverlay = new Container();
    
    // Semi-transparent background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x000000, alpha: 0.9 });
    this.gameCompleteOverlay.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = window.innerWidth / 2;
    panel.y = window.innerHeight / 2;

    const panelBg = new Graphics();
    panelBg.roundRect(-350, -350, 700, 700, 20);
    panelBg.fill(0x1a1a2e);
    panelBg.stroke({ width: 4, color: 0xffd700 });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Game Complete!',
      style: { fontSize: 56, fill: 0xffd700, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -280;
    panel.addChild(title);

    // Sort players by score
    const rankedPlayers = [...this.gameState.players].sort((a, b) => b.totalScore - a.totalScore);

    // Display rankings
    let yPos = -200;
    rankedPlayers.forEach((player, index) => {
      const playerIndex = this.gameState!.players.findIndex(p => p.id === player.id);
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      
      const rankText = new Text({
        text: `${medal} Player ${playerIndex + 1}: ${player.totalScore} points`,
        style: { 
          fontSize: rank === 1 ? 36 : 28, 
          fill: rank === 1 ? 0xffd700 : rank === 2 ? 0xc0c0c0 : rank === 3 ? 0xcd7f32 : 0xffffff,
          fontWeight: rank === 1 ? 'bold' : 'normal'
        }
      });
      rankText.anchor.set(0.5);
      rankText.y = yPos;
      panel.addChild(rankText);
      yPos += rank === 1 ? 60 : 50;
    });

    // Thank you message
    const thanksText = new Text({
      text: 'Thanks for playing!',
      style: { fontSize: 24, fill: 0xaaaaaa }
    });
    thanksText.anchor.set(0.5);
    thanksText.y = 280;
    panel.addChild(thanksText);

    this.gameCompleteOverlay.addChild(panel);
    this.container.addChild(this.gameCompleteOverlay);
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    if (this.bettingContainer) {
      this.bettingContainer.destroy({ children: true });
    }
    if (this.winnerOverlay) {
      this.winnerOverlay.destroy({ children: true });
    }
    if (this.roundCompleteOverlay) {
      this.roundCompleteOverlay.destroy({ children: true });
    }
    if (this.gameCompleteOverlay) {
      this.gameCompleteOverlay.destroy({ children: true });
    }
    this.container.destroy({ children: true });
  }
}
