import { Container } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Card } from './Card';
import { getCardDimensions } from '../../../utils/responsive';
import { getMyHand, canPlayCard, isMyTurn } from '../../../utils/gameHelpers';
import { playCard } from '../../../api/api';

export class PlayerHand extends Container {
  private cards: Card[] = [];

  constructor(gameState: GameState, myPlayerId: string) {
    super();
    this.build(gameState, myPlayerId);
  }

  private build(gameState: GameState, myPlayerId: string): void {
    const myHand = getMyHand(gameState, myPlayerId);
    if (!myHand?.length) return;

    const myTurn = isMyTurn(gameState, myPlayerId);
    const cardDims = getCardDimensions();

    this.cards = myHand.map(card => {
      const c = new Card(card, cardDims.width, cardDims.height);
      const canPlay = myTurn && canPlayCard(gameState, myPlayerId, card);
      c.setClickable(canPlay);

      if (canPlay) {
        c.on('pointerover', () => c.setHighlight(true));
        c.on('pointerout', () => c.setHighlight(false));
        c.on('pointerdown', async () => {
          try {
            const result = await playCard(card);
            if (!result.success) console.error('Failed to play card:', result.error);
          } catch (e) {
            console.error('Error playing card:', e);
          }
        });
      }

      this.addChild(c);
      return c;
    });
  }

  layout(availableWidth: number): void {
    const cardDims = getCardDimensions();
    const cardSpacing = cardDims.width + cardDims.margin;
    const lineSize = Math.max(1, Math.floor(availableWidth / cardSpacing));
    const numRows = Math.ceil(this.cards.length / lineSize);

    for (let row = 0; row < numRows; row++) {
      const rowStart = row * lineSize;
      const rowEnd = Math.min(rowStart + lineSize, this.cards.length);
      const cardsInRow = rowEnd - rowStart;
      const rowWidth = cardsInRow * cardSpacing - cardDims.margin;
      const startX = (availableWidth - rowWidth) / 2;

      for (let col = 0; col < cardsInRow; col++) {
        this.cards[rowStart + col].x = startX + col * cardSpacing;
        this.cards[rowStart + col].y = row * (cardDims.height + cardDims.margin);
      }
    }
  }
}
