import { Container, Graphics } from 'pixi.js';
import { TEAL, TEAL_CSS, SUCCESS_CSS } from '../utils/colors';
import { GameState } from '../types/game-types';
import { getPlayerId } from '../utils/playerId';
import { isMobile, vw, vh, getResponsiveSizes } from '../utils/responsive';
import { BettingPhase } from './game/phases/BettingPhase';
import { PlayingPhase } from './game/phases/PlayingPhase';
import { RoundCompleteOverlay } from './game/overlays/RoundCompleteOverlay';
import { GameCompleteOverlay } from './game/overlays/GameCompleteOverlay';
import { continueGame, getPlayers } from '../api/api';

export class GameScreen {
  private container: Container;
  // sceneLayer sits below the persistent UI so shareButton + overlays always render on top
  private sceneLayer: Container;
  private shareButton: Container;
  private shareDomBtn!: HTMLButtonElement;

  private roundCompleteOverlay: Container | null = null;
  private gameCompleteOverlay: Container | null = null;

  private gameState: GameState | null = null;
  private myPlayerId: string;
  private roomId: string;
  private playerNames: Record<string, { name: string }> = {};

  private bettingPhase: BettingPhase;
  private playingPhase: PlayingPhase;

  constructor(roomId: string, playerIdOverride?: string, initialPlayerNames?: Record<string, { name: string }>) {
    this.container = new Container();
    this.sceneLayer = new Container();
    this.myPlayerId = playerIdOverride ?? getPlayerId();
    this.roomId = roomId;
    if (initialPlayerNames) this.playerNames = initialPlayerNames;

    this.bettingPhase = new BettingPhase(this.sceneLayer);
    this.playingPhase = new PlayingPhase(this.sceneLayer);
    this.shareButton = this.createShareButton();

    this.container.addChild(this.sceneLayer);
    this.container.addChild(this.shareButton);
    this.resizeGame();
  }

  private createShareButton(): Container {
    const size = isMobile() ? 36 : 40;
    const vis = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, size, size, 8);
    bg.fill(TEAL);
    vis.addChild(bg);

    const domBtn = document.createElement('button');
    domBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:60%;height:60%"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
    domBtn.style.cssText = `
      position: fixed; border: 2px solid white; background: ${TEAL_CSS}; border-radius: 8px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      padding: 0; z-index: 1000; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent; box-sizing: border-box;
    `;
    domBtn.addEventListener('pointerdown', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/join?roomId=${this.roomId}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'Join my Up Down Cards game', url }); } catch { /* cancelled */ }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          domBtn.style.background = SUCCESS_CSS;
          setTimeout(() => { domBtn.style.background = TEAL_CSS; }, 1500);
        } catch { /* ignore */ }
      }
    });
    document.body.appendChild(domBtn);
    this.shareDomBtn = domBtn;

    return vis;
  }

  resizeGame(): void {
    const sizes = getResponsiveSizes();
    const buttonSize = isMobile() ? 36 : 40;
    this.shareButton.x = window.innerWidth - sizes.spacing - buttonSize;
    this.shareButton.y = sizes.padding;
    this.shareDomBtn.style.left = `${this.shareButton.x}px`;
    this.shareDomBtn.style.top = `${this.shareButton.y}px`;
    this.shareDomBtn.style.width = `${buttonSize}px`;
    this.shareDomBtn.style.height = `${buttonSize}px`;
  }

  updateGameState(gameState: GameState): void {
    const previousStatus = this.gameState?.status;
    this.gameState = gameState;

    const playerIds = gameState.players.map(p => p.id);
    const missingIds = playerIds.filter(id => !(id in this.playerNames));
    if (missingIds.length > 0) {
      getPlayers(playerIds).then(res => {
        if (res.success) {
          this.playerNames = { ...this.playerNames, ...res.players };
          this.render();
        }
      }).catch(() => { });
    }

    this.handleOverlays(previousStatus);
    this.render();
  }

  private handleOverlays(previousStatus?: string): void {
    if (!this.gameState) return;

    if (this.gameState.status === 'round_complete' && previousStatus !== 'round_complete') {
      this.showRoundCompleteOverlay();
    } else if (this.gameState.status === 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
      this.showRoundCompleteOverlay();
    } else if (this.gameState.status !== 'round_complete' && this.roundCompleteOverlay) {
      this.hideRoundCompleteOverlay();
    }

    if (this.gameState.status === 'game_complete' && previousStatus !== 'game_complete') {
      this.showGameCompleteOverlay();
    }
  }

  private render(): void {
    if (!this.gameState) return;

    this.bettingPhase.clear();
    this.playingPhase.clear();

    switch (this.gameState.status) {
      case 'betting':
        this.bettingPhase.render(this.gameState, this.myPlayerId, this.playerNames);
        break;
      case 'playing_hand':
      case 'hand_complete':
        this.playingPhase.render(this.gameState, this.myPlayerId, this.playerNames, () => this.handleContinue());
        break;
    }
  }

  private showRoundCompleteOverlay(): void {
    if (!this.gameState) return;
    this.roundCompleteOverlay = new RoundCompleteOverlay(this.gameState, this.myPlayerId, this.playerNames, () => this.handleContinue());
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
    this.gameCompleteOverlay = new GameCompleteOverlay(this.gameState, this.playerNames);
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

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.shareDomBtn?.remove();
    this.bettingPhase.clear();
    this.playingPhase.clear();
    if (this.roundCompleteOverlay) this.roundCompleteOverlay.destroy({ children: true });
    if (this.gameCompleteOverlay) this.gameCompleteOverlay.destroy({ children: true });
    this.container.destroy({ children: true });
  }
}
