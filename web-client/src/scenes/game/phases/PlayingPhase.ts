import { Container } from 'pixi.js';
import { GameState, Card as CardType } from '../../../types/game-types';
import { Card } from '../components/Card';
import { getMyHand, canPlayCard, isMyTurn } from '../../../utils/gameHelpers';
import { playCard } from '../../../api/api';
import { LAYOUT, vw, vh, vmin } from '../../../utils/responsive';

export class PlayingPhase {
  private handContainer: Container;
  private tableContainer: Container;
  private cardComponents: Card[] = [];

  constructor(handContainer: Container, tableContainer: Container) {
    this.handContainer = handContainer;
    this.tableContainer = tableContainer;
  }

  renderHand(gameState: GameState, myPlayerId: string): void {
    // Clear existing cards
    this.clearHand();

    const myHand = getMyHand(gameState, myPlayerId);
    if (!myHand || myHand.length === 0) return;

    const myTurn = isMyTurn(gameState, myPlayerId);
    const startX = (window.innerWidth - (myHand.length * 90)) / 2;

    myHand.forEach((card, index) => {
      const cardComponent = new Card(card);
      cardComponent.x = startX + index * 90;
      cardComponent.y = vh(2); // Position relative to handContainer (which is already at handArea.y)

      const canPlay = myTurn && canPlayCard(gameState, myPlayerId, card);
      cardComponent.setClickable(canPlay);

      if (canPlay) {
        cardComponent.on('pointerover', () => cardComponent.setHighlight(true));
        cardComponent.on('pointerout', () => cardComponent.setHighlight(false));
        cardComponent.on('pointerdown', async () => {
          try {
            const result = await playCard(card);
            if (!result.success) {
              console.error('Failed to play card:', result.error);
            }
          } catch (error) {
            console.error('Error playing card:', error);
          }
        });
      }

      this.handContainer.addChild(cardComponent);
      this.cardComponents.push(cardComponent);
    });
  }

  renderTableCards(gameState: GameState): void {
    // Clear existing table cards
    this.clearTable();

    const cardsPlayed = gameState.currentRound?.currentHand?.cardsPlayed || [];
    if (cardsPlayed.length === 0) return;

    const boardArea = LAYOUT.getBoardArea();
    const centerX = window.innerWidth / 2;
    const centerY = boardArea.y + (boardArea.height / 2); // Center of board area
    const radius = vmin(15); // 15% of smallest dimension

    cardsPlayed.forEach((playedCard, index) => {
      const angle = (index / cardsPlayed.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius - 40;
      const y = centerY + Math.sin(angle) * radius - 60;

      const cardComponent = new Card(playedCard.card);
      cardComponent.x = x;
      cardComponent.y = y;

      this.tableContainer.addChild(cardComponent);
    });
  }

  clearHand(): void {
    this.cardComponents.forEach(card => card.destroy({ children: true }));
    this.cardComponents = [];
    this.handContainer.removeChildren();
  }

  clearTable(): void {
    this.tableContainer.removeChildren();
  }

  clear(): void {
    this.clearHand();
    this.clearTable();
  }
}
