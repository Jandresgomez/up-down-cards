import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';

export class Card extends Container {
  private card: CardType;
  private bg: Graphics;
  private cardWidth: number;
  private cardHeight: number;
  private stars: Graphics | null = null;

  /**
   * @param compact - Mesa mode
   */
  constructor(card: CardType, width: number = 80, height: number = 120, compact = false) {
    super();
    this.card = card;
    this.cardWidth = width;
    this.cardHeight = height;

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, width, height, 6);
    this.bg.fill(0xffffff);
    this.bg.stroke({ width: 2, color: 0x333333 });
    this.addChild(this.bg);

    if (compact) {
      // Mesa Label, top right
      const mesaFontSize = Math.floor(height * 0.3);
      const mesaLabel = new Text({
        text: 'Mesa',
        style: { fontSize: mesaFontSize, fill: 0x000000, fontWeight: 'bold' },
      });
      mesaLabel.anchor.set(0, 0);
      mesaLabel.x = Math.floor(width * 0.04);
      mesaLabel.y = Math.floor(height * 0.04);
      this.addChild(mesaLabel);

      // rank + suit side by side, bottom left
      const rankFontSize = Math.floor(height * 0.6);
      const suitFontSize = Math.floor(height);
      const row2Y = Math.floor(height * 0.50);

      const suitText = new Text({
        text: SUIT_SYMBOLS[card.suit],
        style: { fontSize: suitFontSize, fill: SUIT_COLORS[card.suit], fontWeight: 'bold' },
      });
      suitText.anchor.set(1, 1);
      suitText.x = Math.floor(width * 0.94);
      suitText.y = Math.floor(height * 1.1);
      this.addChild(suitText);

      const rankText = new Text({
        text: card.rank,
        style: { fontSize: rankFontSize, fill: SUIT_COLORS[card.suit], fontWeight: 'bold' },
      });
      rankText.anchor.set(1, 1);
      rankText.x = Math.floor(width * 0.94) - suitText.width;
      rankText.y = height;
      this.addChild(rankText);
    } else {
      // Rank top-left, suit bottom-right — fonts proportional to card height
      const rankFontSize = Math.floor(height * 0.33);
      const suitFontSize = Math.floor(height * 0.44);

      const rankText = new Text({
        text: card.rank,
        style: { fontSize: rankFontSize, fill: SUIT_COLORS[card.suit], fontWeight: 'bold' },
      });
      rankText.anchor.set(0, 0);
      rankText.x = Math.floor(width * 0.08);
      rankText.y = Math.floor(height * 0.05);
      this.addChild(rankText);

      const suitText = new Text({
        text: SUIT_SYMBOLS[card.suit],
        style: { fontSize: suitFontSize, fill: SUIT_COLORS[card.suit] },
      });
      suitText.anchor.set(1, 1);
      suitText.x = width - Math.floor(width * 0.08);
      suitText.y = height - Math.floor(height * 0.04);
      this.addChild(suitText);
    }
  }

  setClickable(clickable: boolean): void {
    this.eventMode = clickable ? 'static' : 'auto';
    this.cursor = clickable ? 'pointer' : 'default';
  }

  setHighlight(highlight: boolean): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 6);
    this.bg.fill(0xffffff);
    this.bg.stroke({
      width: highlight ? 4 : 2,
      color: highlight ? 0x11ABD6 : 0x333333
    });
  }

  setWinnerCard(): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 6);
    this.bg.fill(0xffffff);
    this.bg.stroke({ width: 4, color: 0xffd700 });

    if (!this.stars) {
      this.stars = new Graphics();
      this.addChild(this.stars);
    }

    this.stars.clear();

    const positions = [
      { x: this.cardWidth * 0.15, y: this.cardHeight * 0.10 },
      { x: this.cardWidth / 2, y: this.cardHeight * 0.04 },
      { x: this.cardWidth * 0.85, y: this.cardHeight * 0.10 },
      { x: this.cardWidth * 0.96, y: this.cardHeight / 2 },
      { x: this.cardWidth * 0.85, y: this.cardHeight * 0.90 },
      { x: this.cardWidth / 2, y: this.cardHeight * 0.96 },
      { x: this.cardWidth * 0.15, y: this.cardHeight * 0.90 },
      { x: this.cardWidth * 0.04, y: this.cardHeight / 2 },
    ];

    positions.forEach(pos => {
      this.stars!.star(pos.x, pos.y, 5, 8, 4, 0);
      this.stars!.fill(0xffd700);
    });
  }

  getCard(): CardType {
    return this.card;
  }
}
