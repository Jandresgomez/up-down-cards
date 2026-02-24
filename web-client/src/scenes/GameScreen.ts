import { Container, Graphics, Text } from 'pixi.js';
import { GameState, SUIT_SYMBOLS, SUIT_COLORS } from '../types/game-types';
import { getPlayerId } from '../utils/playerId';
import { LAYOUT, vh, vw } from '../utils/responsive';
import { InfoPanel } from './game/components/InfoPanel';
import { PlayerIndicators } from './game/components/PlayerIndicators';
import { BettingPhase } from './game/phases/BettingPhase';
import { PlayingPhase } from './game/phases/PlayingPhase';
import { WinnerOverlay } from './game/overlays/WinnerOverlay';
import { RoundCompleteOverlay } from './game/overlays/RoundCompleteOverlay';
import { GameCompleteOverlay } from './game/overlays/GameCompleteOverlay';
import { continueGame } from '../api/api';

export class GameScreen {
  private container: Container;
  private table: Graphics;
  private mesaCard: Container;
  private handContainer: Container;
  private tableCardsContainer: Container;
  private infoPanel: InfoPanel;
  private playerIndicators: PlayerIndicators;
  private bettingPhase: BettingPhase;
  private playingPhase: PlayingPhase;

  private winnerOverlay: Container | null = null;
  private roundCompleteOverlay: Container | null = null;
  private gameCompleteOverlay: Container | null = null;

  private gameState: GameState | null = null;
  private myPlayerId: string;

  constructor(roomId: string) {
    this.container = new Container();
    this.table = new Graphics();
    this.mesaCard = new Container();
    this.handContainer = new Container();
    this.tableCardsContainer = new Container();
    this.myPlayerId = getPlayerId();

    // Initialize components
    this.infoPanel = new InfoPanel();
    this.playerIndicators = new PlayerIndicators();
    this.bettingPhase = new BettingPhase(this.container);
    this.playingPhase = new PlayingPhase(this.handContainer, this.tableCardsContainer);

    this.createUI();
  }

  private createUI(): void {
    this.container.addChild(this.table);
    this.container.addChild(this.mesaCard);
    this.container.addChild(this.playerIndicators);
    this.container.addChild(this.infoPanel);
    this.container.addChild(this.tableCardsContainer);
    this.container.addChild(this.handContainer);
    this.resizeGame();
  }

  resizeGame(): void {
    const headerArea = LAYOUT.getHeaderArea();
    const boardArea = LAYOUT.getBoardArea();
    const handArea = LAYOUT.getHandArea();

    // Table (game board area)
    this.table.clear();
    this.table.roundRect(
      vw(5),                    // 5% from left
      boardArea.y + vh(2),      // Start after header + 2% padding
      vw(90),                   // 90% width
      boardArea.height - vh(4), // Full board height - padding
      20
    );
    this.table.fill(0x0f3d3e);
    this.table.stroke({ width: 3, color: 0x2a9d8f });

    // Info panel stays in header area
    this.infoPanel.y = headerArea.y;

    // Hand container in hand area
    this.handContainer.x = 0;
    this.handContainer.y = handArea.y;

    // Table cards container in center of board
    this.tableCardsContainer.x = 0;
    this.tableCardsContainer.y = boardArea.y;
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

    // Hand complete overlay
    if (this.gameState.status === 'hand_complete' && previousStatus !== 'hand_complete') {
      this.showWinnerOverlay();
    } else if (this.gameState.status === 'hand_complete' && this.winnerOverlay) {
      this.hideWinnerOverlay();
      this.showWinnerOverlay();
    } else if (this.gameState.status !== 'hand_complete' && this.winnerOverlay) {
      this.hideWinnerOverlay();
    }

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

    // Update info panel
    this.infoPanel.update(this.gameState, this.myPlayerId, window.innerWidth);

    // Update player indicators
    this.playerIndicators.update(this.gameState, this.myPlayerId);

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
    }
  }

  private showWinnerOverlay(): void {
    if (!this.gameState) return;
    this.winnerOverlay = new WinnerOverlay(this.gameState, this.myPlayerId, () => this.handleContinue());
    this.container.addChild(this.winnerOverlay);
  }

  private hideWinnerOverlay(): void {
    if (this.winnerOverlay) {
      this.container.removeChild(this.winnerOverlay);
      this.winnerOverlay.destroy({ children: true });
      this.winnerOverlay = null;
    }
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

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, 60, 54, 8);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    this.mesaCard.addChild(bg);

    // Mesa label
    const label = new Text({
      text: 'Mesa',
      style: { fontSize: 14, fill: 0x666666, fontWeight: 'bold' }
    });
    label.x = 8;
    label.y = 8;
    this.mesaCard.addChild(label);

    // Rank and Suit on same line
    const cardText = new Text({
      text: `${mesa.rank}${SUIT_SYMBOLS[mesa.suit]}`,
      style: { fontSize: 24, fill: SUIT_COLORS[mesa.suit], fontWeight: 'bold' }
    });
    cardText.x = 8;
    cardText.y = 24;
    this.mesaCard.addChild(cardText);

    // Position in top-left corner of the game board
    const boardArea = LAYOUT.getBoardArea();
    this.mesaCard.x = vw(7);  // Slightly inside the board
    this.mesaCard.y = boardArea.y + vh(4); // Slightly below board top
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.bettingPhase.clear();
    this.playingPhase.clear();
    if (this.winnerOverlay) this.winnerOverlay.destroy({ children: true });
    if (this.roundCompleteOverlay) this.roundCompleteOverlay.destroy({ children: true });
    if (this.gameCompleteOverlay) this.gameCompleteOverlay.destroy({ children: true });
    this.container.destroy({ children: true });
  }
}
