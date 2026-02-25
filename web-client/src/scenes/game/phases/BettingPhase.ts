import { Container } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { BettingUI } from '../components/BettingUI';
import { getValidBets, isMyTurn } from '../../../utils/gameHelpers';
import { placeBet } from '../../../api/api';

export class BettingPhase {
  private container: Container;
  private bettingUI: BettingUI | null = null;

  constructor(container: Container) {
    this.container = container;
  }

  render(gameState: GameState, myPlayerId: string): void {
    // Clear existing UI
    this.clear();

    // Only show betting UI if it's my turn
    if (!isMyTurn(gameState, myPlayerId)) return;

    const validBets = getValidBets(gameState, myPlayerId);

    this.bettingUI = new BettingUI(validBets, async (bet) => {
      try {
        const result = await placeBet(bet);
        if (!result.success) {
          console.error('Failed to place bet:', result.error);
        }
      } catch (error) {
        console.error('Error placing bet:', error);
      }
    });

    // BettingUI now centers itself
    this.container.addChild(this.bettingUI);
  }

  clear(): void {
    if (this.bettingUI) {
      this.container.removeChild(this.bettingUI);
      this.bettingUI.destroy({ children: true });
      this.bettingUI = null;
    }
  }
}
