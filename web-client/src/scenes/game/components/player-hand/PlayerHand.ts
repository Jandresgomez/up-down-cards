import { Container } from 'pixi.js';
import { GameState } from '../../../../types/game-types';
import { Card } from '../Card';
import { getCardDimensions, getResponsiveSizes } from '../../../../utils/responsive';
import { getMyHand, canPlayCard, isMyTurn } from '../../../../utils/gameHelpers';
import { playCard } from '../../../../api/api';
import { PlayerHandMessagePanel } from './PlayerHandMessagePanel';

export class PlayerHand extends Container {
  private gameState: GameState;
  private myPlayerId: string;
  private cards: Card[] = [];
  private handMessagePanel: PlayerHandMessagePanel;

  constructor(gameState: GameState, myPlayerId: string) {
    super();
    this.handMessagePanel = new PlayerHandMessagePanel(gameState);
    this.gameState = gameState;
    this.myPlayerId = myPlayerId;
    this.build(gameState, myPlayerId);
  }

  private build(gameState: GameState, myPlayerId: string): void {
    this.handMessagePanel.build(gameState);
    this.definePlayerMessage();
    this.addChild(this.handMessagePanel);

    const myHand = getMyHand(gameState, myPlayerId);
    if (!myHand?.length) return;

    const myTurn = isMyTurn(gameState, myPlayerId);
    const cardDims = getCardDimensions();

    this.cards = myHand.map(card => {
      const c = new Card(card, cardDims.width, cardDims.height);
      const canPlay = myTurn && canPlayCard(gameState, myPlayerId, card);
      c.setClickable(true);


      if (!myTurn) {
        c.on('pointerover', () => c.setHighlight('highlight'));
        c.on('pointerout', () => c.setHighlight('none'));
        c.on('pointerdown', async () => {
          c.shake()
          this.setTemporalPlayerMessage({ text: "Wait for your turn!", type: 'error' }, 2000);
        });
      } else if (canPlay) {
        c.on('pointerover', () => c.setHighlight('highlight'));
        c.on('pointerout', () => c.setHighlight('none'));
        c.on('pointerdown', async () => {
          try {
            const result = await playCard(card);
            if (!result.success) console.error('Failed to play card:', result.error);
          } catch (e) {
            console.error('Error playing card:', e);
          }
        });
      } else {
        c.on('pointerover', () => c.setHighlight('highlight'));
        c.on('pointerout', () => c.setHighlight('none'));
        c.on('pointerdown', async () => {
          c.shake()
          this.setTemporalPlayerMessage({ text: "You can't play that card!", type: 'error' }, 2000);
        });
      }

      this.addChild(c);
      return c;
    });
  }

  layout(availableWidth: number): void {
    const cardDims = getCardDimensions();
    const sizes = getResponsiveSizes();
    const cardSpacing = cardDims.width + cardDims.margin;
    const lineSize = Math.max(1, Math.floor(availableWidth / cardSpacing));
    const numRows = Math.ceil(this.cards.length / lineSize);

    this.handMessagePanel.y = 0;
    this.handMessagePanel.x = 0;
    const baseY = this.handMessagePanel.height + sizes.spacing;

    for (let row = 0; row < numRows; row++) {
      const rowStart = row * lineSize;
      const rowEnd = Math.min(rowStart + lineSize, this.cards.length);
      const cardsInRow = rowEnd - rowStart;
      const rowWidth = cardsInRow * cardSpacing - cardDims.margin;
      const startX = (availableWidth - rowWidth) / 2;

      for (let col = 0; col < cardsInRow; col++) {
        this.cards[rowStart + col].x = startX + col * cardSpacing;
        this.cards[rowStart + col].y = baseY + row * (cardDims.height + cardDims.margin);
      }
    }
  }

  definePlayerMessage(): void {
    const isHandComplete = this.gameState.status === 'hand_complete';
    const myTurnNow = !isHandComplete && isMyTurn(this.gameState, this.myPlayerId);

    if (myTurnNow) {
      this.handMessagePanel.setMessage({ text: 'Your turn, pick a card!', type: 'attention' });
    } else {
      this.handMessagePanel.setMessage({ text: 'Waiting for other players to play...', type: 'info' });
    }
  }

  updatePlayerMessage(content: PlayerHandMessagePanel['messageContent']): void {
    this.handMessagePanel.setMessage(content);
  }

  setTemporalPlayerMessage(content: PlayerHandMessagePanel['messageContent'], timeout: number): void {
    this.handMessagePanel.setTemporalMessage(content, timeout);
  }
}
