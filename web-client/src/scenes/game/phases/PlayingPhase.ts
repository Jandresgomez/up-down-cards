import { Container } from 'pixi.js';
import { GameState, Card as CardType } from '../../../types/game-types';
import { Card } from '../components/Card';
import { getMyHand, canPlayCard, isMyTurn } from '../../../utils/gameHelpers';
import { playCard } from '../../../api/api';
import { LAYOUT, vw, vh, getCardDimensions } from '../../../utils/responsive';

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
    const cardDims = getCardDimensions();
    const cardSpacing = cardDims.width + cardDims.margin;
    const startX = (window.innerWidth - (myHand.length * cardSpacing)) / 2;

    myHand.forEach((card, index) => {
      const cardComponent = new Card(card, cardDims.width, cardDims.height);
      cardComponent.x = startX + index * cardSpacing;
      cardComponent.y = vh(2);

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

    const cardDims = getCardDimensions();
    const cardSpacing = cardDims.width + cardDims.margin;

    const LINE_SIZE = Math.floor((window.innerWidth - vw(14)) / cardSpacing);
    const baseX = vw(7);
    const baseY = vh(4) + 100;

    cardsPlayed.forEach((playedCard, index) => {
      const x = baseX + cardSpacing * (index % LINE_SIZE);
      const y = baseY + (cardDims.height + cardDims.margin) * Math.floor(index / LINE_SIZE);

      const cardComponent = new Card(playedCard.card, cardDims.width, cardDims.height);
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
