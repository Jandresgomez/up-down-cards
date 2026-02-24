import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';

export class Card extends Container {
  private card: CardType;
  private bg: Graphics;
  private isClickable: boolean = false;

  constructor(card: CardType, width: number = 80, height: number = 120) {
    super();
    this.card = card;

    // Background
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, width, height, 8);
    this.bg.fill(0xffffff);
    this.bg.stroke({ width: 2, color: 0x333333 });
    this.addChild(this.bg);

    // Rank
    const rankText = new Text({
      text: card.rank,
      style: { fontSize: 24, fill: SUIT_COLORS[card.suit], fontWeight: 'bold' }
    });
    rankText.x = 10;
    rankText.y = 10;
    this.addChild(rankText);

    // Suit
    const suitText = new Text({
      text: SUIT_SYMBOLS[card.suit],
      style: { fontSize: 32, fill: SUIT_COLORS[card.suit] }
    });
    suitText.anchor.set(0.5);
    suitText.x = width / 2;
    suitText.y = height / 2;
    this.addChild(suitText);
  }

  setClickable(clickable: boolean): void {
    this.isClickable = clickable;
    this.eventMode = clickable ? 'static' : 'auto';
    this.cursor = clickable ? 'pointer' : 'default';
  }

  setHighlight(highlight: boolean): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, 80, 120, 8);
    this.bg.fill(0xffffff);
    this.bg.stroke({ 
      width: highlight ? 4 : 2, 
      color: highlight ? 0xffd700 : 0x333333 
    });
  }

  getCard(): CardType {
    return this.card;
  }
}
