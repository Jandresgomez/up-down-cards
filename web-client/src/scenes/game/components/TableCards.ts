import { Container } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Card } from './Card';
import { getPlayedCardDimensions } from '../../../utils/responsive';
import { PLAYER_COLORS } from '../../../utils/colors';

export class TableCards extends Container {
  private gameState: GameState;
  private winnerId: string | undefined;

  constructor(gameState: GameState, winnerId?: string) {
    super();
    this.gameState = gameState;
    this.winnerId = winnerId;
  }

  private build(availableWidth: number): void {
    this.removeChildren();
    const cardsPlayed = this.gameState.currentRound?.currentHand?.cardsPlayed ?? [];
    if (!cardsPlayed.length) return;

    const cardDims = getPlayedCardDimensions();
    const cardSpacing = cardDims.width + cardDims.margin;
    const lineSize = Math.max(1, Math.floor(availableWidth / cardSpacing));

    cardsPlayed.forEach((played, i) => {
      const naturalOrderForPlayer = this.gameState.players.find(player => player.id === played.playerId)?.naturalOrder ?? 0;
      const c = new Card(played.card, cardDims.width, cardDims.height);
      c.setPlayedCardColor(PLAYER_COLORS[naturalOrderForPlayer])
      c.x = cardSpacing * (i % lineSize);
      c.y = (cardDims.height + cardDims.margin) * Math.floor(i / lineSize);
      if (this.winnerId && played.playerId === this.winnerId) c.setWinnerCard();
      this.addChild(c);
    });
  }

  layout(x: number, y: number, availableWidth: number): void {
    this.x = x;
    this.y = y;
    this.build(availableWidth);
  }
}
