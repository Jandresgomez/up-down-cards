import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { GameState, SUIT_SYMBOLS, SUIT_COLORS } from '../types/game-types';
import { getPlayerId } from '../utils/playerId';
import { LAYOUT, vh, vw, isMobile, getCardDimensions } from '../utils/responsive';
import { GamePlayerIndicators } from './game/components/GamePlayerIndicators';
import { BettingPhase } from './game/phases/BettingPhase';
import { PlayingPhase } from './game/phases/PlayingPhase';
import { RoundCompleteOverlay } from './game/overlays/RoundCompleteOverlay';
import { GameCompleteOverlay } from './game/overlays/GameCompleteOverlay';
import { continueGame } from '../api/api';

export class GameScreen {
  private container: Container;
  private table: Graphics;
  private mesaCard: Container;
  private handContainer: Container;
  private tableCardsContainer: Container;
  private playerIndicators: GamePlayerIndicators;
  private bettingPhase: BettingPhase;
  private playingPhase: PlayingPhase;
  private roundTitle: Text;
  private shareButton: Container;

  private roundCompleteOverlay: Container | null = null;
  private gameCompleteOverlay: Container | null = null;

  private gameState: GameState | null = null;
  private myPlayerId: string;
  private roomId: string;

  constructor(roomId: string) {
    this.container = new Container();
    this.table = new Graphics();
    this.mesaCard = new Container();
    this.handContainer = new Container();
    this.tableCardsContainer = new Container();
    this.myPlayerId = getPlayerId();
    this.roomId = roomId;

    // Initialize components
    this.playerIndicators = new GamePlayerIndicators();
    this.bettingPhase = new BettingPhase(this.container);
    this.playingPhase = new PlayingPhase(this.handContainer, this.tableCardsContainer);
    
    // Round title
    this.roundTitle = new Text({
      text: '',
      style: { fontSize: isMobile() ? 16 : 20, fill: 0xffffff, fontWeight: 'bold' }
    });
    
    // Share button
    this.shareButton = this.createShareButton();

    this.createUI();
  }

  private createUI(): void {
    this.container.addChild(this.table);
    this.container.addChild(this.playerIndicators);
    this.container.addChild(this.mesaCard);
    this.container.addChild(this.tableCardsContainer);
    this.container.addChild(this.handContainer);
    this.container.addChild(this.roundTitle);
    this.container.addChild(this.shareButton);
    this.resizeGame();
  }

  private createShareButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const size = isMobile() ? 36 : 40;
    const bg = new Graphics();
    bg.roundRect(0, 0, size, size, 8);
    bg.fill(0x2a9d8f);
    btn.addChild(bg);

    // Load SVG icon asynchronously
    Assets.load('/icons/icons8-share.svg').then(texture => {
      const icon = new Sprite(texture);
      icon.width = size * 0.6;
      icon.height = size * 0.6;
      icon.x = size * 0.2;
      icon.y = size * 0.2;
      icon.tint = 0xffffff;
      btn.addChild(icon);
    });

    btn.on('pointerdown', () => {
      const url = `${window.location.origin}/re-join?roomId=${this.roomId}`;
      navigator.clipboard.writeText(url).then(() => {
        console.log('Share link copied:', url);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    });

    return btn;
  }

  resizeGame(): void {
    const boardArea = LAYOUT.getBoardArea();
    const handArea = LAYOUT.getHandArea();

    // Table (game board area) - bottom section for played cards + mesa
    this.table.clear();
    this.table.roundRect(
      vw(5),
      boardArea.y + boardArea.height * 0.3, // Start at 30% down the board area
      vw(90),
      boardArea.height * 0.7 - vh(2), // 70% of board height
      20
    );
    this.table.fill(0x0f3d3e);
    this.table.stroke({ width: 3, color: 0x2a9d8f });

    // Hand container in hand area
    this.handContainer.x = 0;
    this.handContainer.y = handArea.y;

    // Table cards container in center of board
    this.tableCardsContainer.x = 0;
    this.tableCardsContainer.y = boardArea.y + boardArea.height * 0.3;

    // Position round title (top-left)
    const horizontalPadding = isMobile() ? vw(5) : vw(3);
    const verticalPadding = isMobile() ? vh(2) : vh(1);
    const buttonSize = isMobile() ? 36 : 40;
    
    // Center button and title vertically with each other
    const titleCenterY = verticalPadding + buttonSize / 2;
    
    this.roundTitle.anchor.set(0, 0.5);
    this.roundTitle.x = horizontalPadding;
    this.roundTitle.y = titleCenterY;

    // Position player indicators below title
    this.playerIndicators.y = verticalPadding + buttonSize;

    // Position share button (top-right, vertically aligned with title)
    this.shareButton.x = window.innerWidth - horizontalPadding - buttonSize;
    this.shareButton.y = verticalPadding;
  }

  updateGameState(gameState: GameState): void {
    const previousStatus = this.gameState?.status;
    this.gameState = gameState;

    // Handle overlays
    this.handleOverlays(previousStatus);

    // Render based on status
    this.render();
  }

  private handleOverlays(previousStatus?: string): void {
    if (!this.gameState) return;

    // Round complete overlay
    if (this.gameState.status === 'round_complete' && previousStatus !== 'round_complete') {
      this.showRoundCompleteOverlay();
    } else if (this.gameState.status === 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
      this.showRoundCompleteOverlay();
    } else if (this.gameState.status !== 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
    }

    // Game complete overlay
    if (this.gameState.status === 'game_complete' && previousStatus !== 'game_complete') {
      this.showGameCompleteOverlay();
    }
  }

  private render(): void {
    if (!this.gameState) return;

    // Update player indicators
    this.playerIndicators.update(this.gameState, this.myPlayerId);

    // Update round title
    this.updateRoundTitle();

    // Update mesa card
    this.renderMesaCard();

    // Clear phase-specific UI
    this.bettingPhase.clear();
    this.playingPhase.clear();

    // Render based on status
    switch (this.gameState.status) {
      case 'betting':
        this.bettingPhase.render(this.gameState, this.myPlayerId);
        this.playingPhase.renderHand(this.gameState, this.myPlayerId);
        break;

      case 'playing_hand':
        this.playingPhase.renderHand(this.gameState, this.myPlayerId);
        this.playingPhase.renderTableCards(this.gameState);
        break;

      case 'hand_complete':
        const lastHand = this.gameState.currentRound?.completedHands[
          this.gameState.currentRound.completedHands.length - 1
        ];
        this.playingPhase.renderHandComplete(this.gameState, this.myPlayerId);
        this.playingPhase.renderTableCards(this.gameState, lastHand?.winnerId);
        break;
    }
  }

  private updateRoundTitle(): void {
    if (!this.gameState?.currentRound) {
      this.roundTitle.text = '';
      return;
    }

    const round = this.gameState.currentRound;
    const direction = round.direction === 'up' ? 'Going Up' : 'Going Down';
    this.roundTitle.text = `Round ${round.roundNumber} of ${this.gameState.numberOfRounds} (${direction})`;
  }

  private showRoundCompleteOverlay(): void {
    if (!this.gameState) return;
    this.roundCompleteOverlay = new RoundCompleteOverlay(this.gameState, this.myPlayerId, () => this.handleContinue());
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
    this.gameCompleteOverlay = new GameCompleteOverlay(this.gameState);
    this.container.addChild(this.gameCompleteOverlay);
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

  private renderMesaCard(): void {
    this.mesaCard.removeChildren();

    if (!this.gameState?.currentRound?.mesa) return;

    const mesa = this.gameState.currentRound.mesa;
    const mobile = isMobile();
    const cardWidth = mobile ? 50 : 60;
    const cardHeight = mobile ? 44 : 54;
    const fontSize = mobile ? 12 : 14;
    const rankSize = mobile ? 20 : 24;

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, cardWidth, cardHeight, 8);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    this.mesaCard.addChild(bg);

    // Mesa label
    const label = new Text({
      text: 'Mesa',
      style: { fontSize, fill: 0x666666, fontWeight: 'bold' }
    });
    label.x = 6;
    label.y = 6;
    this.mesaCard.addChild(label);

    // Rank and Suit on same line
    const cardText = new Text({
      text: `${mesa.rank}${SUIT_SYMBOLS[mesa.suit]}`,
      style: { fontSize: rankSize, fill: SUIT_COLORS[mesa.suit], fontWeight: 'bold' }
    });
    cardText.x = 6;
    cardText.y = mobile ? 20 : 24;
    this.mesaCard.addChild(cardText);

    // Position inside the board area (top-left of board)
    const boardArea = LAYOUT.getBoardArea();
    this.mesaCard.x = vw(7);
    this.mesaCard.y = boardArea.y + boardArea.height * 0.3 + vh(2);
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.bettingPhase.clear();
    this.playingPhase.clear();
    if (this.roundCompleteOverlay) this.roundCompleteOverlay.destroy({ children: true });
    if (this.gameCompleteOverlay) this.gameCompleteOverlay.destroy({ children: true });
    this.container.destroy({ children: true });
  }
}
