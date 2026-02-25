import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';

export class Card extends Container {
  private card: CardType;
  private bg: Graphics;
  private cardWidth: number;
  private cardHeight: number;
  private isClickable: boolean = false;
  private stars: Graphics | null = null;

  constructor(card: CardType, width: number = 80, height: number = 120) {
    super();
    this.card = card;
    this.cardWidth = width;
    this.cardHeight = height;

    // Background
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 8);
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
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 8);
    this.bg.fill(0xffffff);
    this.bg.stroke({
      width: highlight ? 4 : 2,
      color: highlight ? 0x11ABD6 : 0x333333
    });
  }

  setWinnerCard(): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 8);
    this.bg.fill(0xffffff);
    this.bg.stroke({
      width: 4,
      color: 0xffd700,
    });

    // Add stars if not already present
    if (!this.stars) {
      this.stars = new Graphics();
      this.addChild(this.stars);
    }

    this.stars.clear();
    
    // Draw stars at corners and mid-points
    const positions = [
      { x: 10, y: 10 },                           // Top-left
      { x: this.cardWidth / 2, y: 5 },            // Top-center
      { x: this.cardWidth - 10, y: 10 },          // Top-right
      { x: this.cardWidth - 5, y: this.cardHeight / 2 }, // Right-center
      { x: this.cardWidth - 10, y: this.cardHeight - 10 }, // Bottom-right
      { x: this.cardWidth / 2, y: this.cardHeight - 5 },   // Bottom-center
      { x: 10, y: this.cardHeight - 10 },         // Bottom-left
      { x: 5, y: this.cardHeight / 2 }            // Left-center
    ];

    positions.forEach(pos => {
      this.drawStar(this.stars!, pos.x, pos.y, 5, 8, 4);
    });
  }

  getCard(): CardType {
    return this.card;
  }

  private drawStar(graphics: Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    const step = Math.PI / spikes;
    graphics.star(cx, cy, spikes, outerRadius, innerRadius, 0);
    graphics.fill(0xffd700);
  }
}
