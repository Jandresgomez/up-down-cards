import { Container } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { BettingScene } from '../scenes/BettingScene';
import { getValidBets, isMyTurn as checkIsMyTurn } from '../../../utils/gameHelpers';
import { placeBet } from '../../../api/api';

export class BettingPhase {
  private container: Container;
  private bettingScene: BettingScene | null = null;

  constructor(container: Container) {
    this.container = container;
  }

  render(gameState: GameState, myPlayerId: string): void {
    // Clear existing UI
    this.clear();

    // Show betting scene for all players during betting phase
    const validBets = getValidBets(gameState, myPlayerId);
    const maxBet = gameState.currentRound?.cardsPerPlayer || 0;
    const isMyTurn = checkIsMyTurn(gameState, myPlayerId);

    this.bettingScene = new BettingScene(gameState, myPlayerId, validBets, maxBet, isMyTurn, async (bet) => {
      try {
        const result = await placeBet(bet);
        if (!result.success) {
          console.error('Failed to place bet:', result.error);
        }
      } catch (error) {
        console.error('Error placing bet:', error);
      }
    });

    this.container.addChild(this.bettingScene);
  }

  clear(): void {
    if (this.bettingScene) {
      this.container.removeChild(this.bettingScene);
      this.bettingScene.destroy({ children: true });
      this.bettingScene = null;
    }
  }
}
