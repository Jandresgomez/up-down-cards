import { Container } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { PlayingScene } from '../scenes/PlayingScene';

export class PlayingPhase {
  private container: Container;
  private playingScene: PlayingScene | null = null;

  constructor(container: Container) {
    this.container = container;
  }

  render(
    gameState: GameState,
    myPlayerId: string,
    playerNames: Record<string, { name: string }>,
    onContinue: () => void
  ): void {
    this.clear();
    this.playingScene = new PlayingScene(gameState, myPlayerId, playerNames, onContinue);
    this.container.addChild(this.playingScene);
  }

  clear(): void {
    if (this.playingScene) {
      this.container.removeChild(this.playingScene);
      this.playingScene.destroy({ children: true });
      this.playingScene = null;
    }
  }
}
