import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';
import { CARD_BG, CARD_BORDER, CARD_HIGHLIGHT, CARD_ERROR, CARD_WINNER, TEXT_DARK } from '../../../utils/colors';

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
    this.bg.fill(CARD_BG);
    this.bg.stroke({ width: 2, color: CARD_BORDER });
    this.addChild(this.bg);

    if (compact) {
      // Mesa Label, top right
      const mesaFontSize = Math.floor(height * 0.3);
      const mesaLabel = new Text({
        text: 'Mesa',
        style: { fontSize: mesaFontSize, fill: TEXT_DARK, fontWeight: 'bold' },
      });
      mesaLabel.anchor.set(0, 0);
      mesaLabel.x = Math.floor(width * 0.04);
      mesaLabel.y = Math.floor(height * 0.04);
      this.addChild(mesaLabel);

      // rank + suit side by side, bottom left
      const rankFontSize = Math.floor(height * 0.6);
      const suitFontSize = Math.floor(height);

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
      const rankFontSize = Math.floor(height * 0.55);
      const suitFontSize = Math.floor(height * 0.65);

      const rankText = new Text({
        text: card.rank,
        style: { fontSize: rankFontSize, fill: SUIT_COLORS[card.suit], fontWeight: 'bold' },
      });
      rankText.anchor.set(0, 0);
      rankText.x = Math.floor(width * 0.04);
      rankText.y = Math.floor(height * 0);
      this.addChild(rankText);

      const suitText = new Text({
        text: SUIT_SYMBOLS[card.suit],
        style: { fontSize: suitFontSize, fill: SUIT_COLORS[card.suit] },
      });
      suitText.anchor.set(1, 1);
      suitText.x = width - Math.floor(width * 0.04);
      suitText.y = height - Math.floor(height * -0.05);
      this.addChild(suitText);
    }
  }

  setClickable(clickable: boolean): void {
    this.eventMode = clickable ? 'static' : 'auto';
    this.cursor = clickable ? 'pointer' : 'default';
  }

  setHighlight(highlight: 'none' | 'highlight' | 'red'): void {
    const width = highlight === 'none' ? 2 : 4;
    const color = (() => {
      switch (highlight) {
        case 'none':
          return CARD_BORDER;
        case 'highlight':
          return CARD_HIGHLIGHT;
        case 'red':
          return CARD_ERROR;
      }
    })();

    this.bg.clear();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 6);
    this.bg.fill(CARD_BG);
    this.bg.stroke({
      width,
      color
    });
  }

  shake(): void {
    const original = 0;
    const angle = (5 * Math.PI) / 180;
    this.setHighlight('red');
    let step = 0;
    const interval = setInterval(() => {
      if (step >= 6) {
        this.rotation = 0;
        clearInterval(interval);
        this.setHighlight('none');
        return;
      }
      this.rotation = original + (step % 2 === 0 ? angle : -angle);
      step++;
    }, 50);
  }

  setWinnerCard(): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.cardWidth, this.cardHeight, 6);
    this.bg.fill(CARD_BG);
    this.bg.stroke({ width: 4, color: CARD_WINNER });

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
      this.stars!.fill(CARD_WINNER);
    });
  }

  getCard(): CardType {
    return this.card;
  }
}
