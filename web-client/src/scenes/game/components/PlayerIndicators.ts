import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { LAYOUT, vw, vh } from '../../../utils/responsive';

export class PlayerIndicators extends Container {
  private indicators: Container[] = [];

  constructor() {
    super();
  }

  update(gameState: GameState, myPlayerId: string): void {
    // Clear existing indicators
    this.indicators.forEach(ind => ind.destroy({ children: true }));
    this.indicators = [];
    this.removeChildren();

    const { players, status, currentRound } = gameState;
    if (!currentRound) return;

    // Determine current player
    let currentPlayerId: string | null = null;
    if (status === 'betting') {
      currentPlayerId = players[currentRound.currentBettingIndex]?.id;
    } else if (status === 'playing_hand' && currentRound.currentHand) {
      const currentPlayerIndex = currentRound.currentHand.currentPlayerIndex;
      currentPlayerId = currentRound.currentHand.handOrder[currentPlayerIndex];
    }

    // Position indicators in top-right corner, stacked vertically
    const boardArea = LAYOUT.getBoardArea();
    const startX = window.innerWidth - vw(9.5);
    const startY = boardArea.y + vh(5.5);
    const spacing = 35; // Vertical spacing between indicators

    players.forEach((player, index) => {
      const indicator = this.createIndicator(
        player.id,
        index,
        myPlayerId,
        player.id === currentPlayerId
      );
      indicator.x = startX;
      indicator.y = startY + (index * spacing);

      this.addChild(indicator);
      this.indicators.push(indicator);
    });
  }

  private createIndicator(
    playerId: string,
    playerIndex: number,
    myPlayerId: string,
    isActive: boolean
  ): Container {
    const container = new Container();

    // Label (to the left of circle)
    const label = new Text({
      text: playerId === myPlayerId ? 'You' : `P${playerIndex + 1}`,
      style: { fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(1, 0.5); // Right-aligned, vertically centered
    label.x = -30; // 30px to the left of circle (more space)
    label.y = 0;
    container.addChild(label);

    // Circle with anti-aliasing
    const circle = new Graphics();
    circle.circle(0, 0, 15);

    if (isActive) {
      circle.fill({ color: 0x4caf50, alpha: 1 }); // Filled green for active player
      circle.stroke({ width: 2, color: 0xffffff, alpha: 1 }); // Add border for definition
    } else {
      circle.stroke({ width: 3, color: 0xffffff, alpha: 1 }); // Border only for inactive
    }

    // Enable anti-aliasing
    circle.eventMode = 'static';

    container.addChild(circle);

    return container;
  }
}
