import { Container, Text } from 'pixi.js';
import { GameState, Card as CardType } from '../../../types/game-types';
import { Card } from '../components/Card';
import { getMyHand, canPlayCard, isMyTurn } from '../../../utils/gameHelpers';
import { playCard, continueGame } from '../../../api/api';
import { LAYOUT, vw, vh, getCardDimensions, isMobile } from '../../../utils/responsive';
import { Button } from '../components/Button';

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

  renderHandComplete(gameState: GameState, myPlayerId: string): void {
    this.clearHand();

    if (!gameState.currentRound) return;

    const lastHand = gameState.currentRound.completedHands[
      gameState.currentRound.completedHands.length - 1
    ];
    if (!lastHand) return;

    const winnerIndex = gameState.players.findIndex(p => p.id === lastHand.winnerId);
    const playersReady = gameState.currentRound.currentHand?.playersReady || [];
    const hasClicked = playersReady.includes(myPlayerId);

    // Winner text
    const mobile = isMobile();
    const winnerText = new Text({
      text: `Player ${winnerIndex + 1} wins this Hand!`,
      style: { fontSize: mobile ? 24 : 32, fill: 0xffd700, fontWeight: 'bold' }
    });
    winnerText.anchor.set(0.5);
    winnerText.x = window.innerWidth / 2;
    winnerText.y = vh(4);
    this.handContainer.addChild(winnerText);

    // Ready counter
    const readyText = new Text({
      text: `${playersReady.length}/${gameState.players.length}`,
      style: { fontSize: 24, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.x = window.innerWidth / 2;
    readyText.y = vh(10);
    this.handContainer.addChild(readyText);

    // Continue button
    const continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      200,
      60,
      hasClicked ? 0x666666 : 0x4caf50
    );
    continueBtn.x = window.innerWidth / 2 - 100;
    continueBtn.y = vh(14);
    if (!hasClicked) {
      continueBtn.on('pointerdown', async () => {
        try {
          const result = await continueGame();
          if (!result.success) {
            console.error('Failed to continue:', result.error);
          }
        } catch (error) {
          console.error('Error continuing:', error);
        }
      });
    }
    this.handContainer.addChild(continueBtn);
  }

  renderTableCards(gameState: GameState, winnerId?: string): void {
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

      // Highlight winner card
      if (winnerId && playedCard.playerId === winnerId) {
        cardComponent.setWinnerCard();
      }

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
