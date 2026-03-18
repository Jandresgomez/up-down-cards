import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';
import { CARD_BG, CARD_BORDER, CARD_HIGHLIGHT, CARD_ERROR, CARD_WINNER, TEXT_DARK } from '../../../utils/colors';
import { getResponsiveSizes } from '../../../utils/responsive';

type InnerCardDimensions = {
  width: number,
  height: number,
  topMargin: number,
  sideMargin: number,
  bottomMargin: number,
}

export class Card extends Container {
  private card: CardType;
  private cardBody: Graphics;
  private playedCardBorder: Graphics;
  private cardWidth: number;
  private cardHeight: number;
  private stars: Graphics | null = null;
  private isWinnerCard: boolean = false;
  // Shows card was played by X user by adding a border to the car
  private playedCardColor: number | null = null;
  private currentHighlight: 'none' | 'highlight' | 'red' = 'none';
  // Mesa mode
  private compact: boolean;

  constructor(
    card: CardType,
    width: number = 80,
    height: number = 120,
    compact = false
  ) {
    super();
    this.card = card;
    this.cardWidth = width;
    this.cardHeight = height;
    this.compact = compact;
    this.cardBody = new Graphics();
    this.playedCardBorder = new Graphics();
    this.render();
  }

  private getInnerCardDimensions(): InnerCardDimensions {
    const sizes = getResponsiveSizes();
    if (this.playedCardColor) {
      return {
        height: this.cardHeight - 2 * sizes.padding,
        width: this.cardWidth - sizes.padding,
        topMargin: sizes.padding / 2,
        sideMargin: sizes.padding / 2,
        bottomMargin: Math.floor(3 * sizes.padding / 4),
      }
    }

    return {
      height: this.cardHeight,
      width: this.cardWidth,
      topMargin: 0,
      sideMargin: 0,
      bottomMargin: 0,
    }
  }

  render(): void {
    this.removeChildren();
    const innerCardDimensions = this.getInnerCardDimensions();

    if (this.playedCardColor) {
      const borderWidth = 0;
      const borderColor = (() => {
        switch (this.currentHighlight) {
          case 'none':
            return CARD_BORDER;
          case 'highlight':
            return CARD_HIGHLIGHT;
          case 'red':
            return CARD_ERROR;
        }
      })();

      this.playedCardBorder.clear();
      this.playedCardBorder.roundRect(0, 0, this.cardWidth, this.cardHeight, 6);
      this.playedCardBorder.fill(this.playedCardColor);
      this.addChild(this.playedCardBorder);

      this.cardBody.clear();
      this.cardBody.roundRect(
        innerCardDimensions.topMargin,
        innerCardDimensions.sideMargin,
        innerCardDimensions.width,
        innerCardDimensions.height,
        6
      );
      this.cardBody.fill(CARD_BG);
      this.cardBody.stroke({
        width: borderWidth,
        color: borderColor,
      });
      this.addChild(this.cardBody);
    } else {
      const borderWidth = this.currentHighlight === 'none' ? 2 : 4;
      const borderColor = (() => {
        switch (this.currentHighlight) {
          case 'none':
            return CARD_BORDER;
          case 'highlight':
            return CARD_HIGHLIGHT;
          case 'red':
            return CARD_ERROR;
        }
      })();

      this.cardBody.clear();
      this.cardBody.roundRect(
        innerCardDimensions.topMargin,
        innerCardDimensions.sideMargin,
        innerCardDimensions.width,
        innerCardDimensions.height,
        6
      );
      this.cardBody.fill(CARD_BG);
      this.cardBody.stroke({
        width: borderWidth,
        color: borderColor,
      });
      this.addChild(this.cardBody);
    }

    if (this.compact) {
      // Mesa Label, top right
      const mesaFontSize = Math.floor(innerCardDimensions.height * 0.3);
      const mesaLabel = new Text({
        text: 'Mesa',
        style: { fontSize: mesaFontSize, fill: TEXT_DARK, fontWeight: 'bold' },
      });
      mesaLabel.anchor.set(0, 0);
      mesaLabel.x = innerCardDimensions.sideMargin + Math.floor(innerCardDimensions.width * 0.04);
      mesaLabel.y = innerCardDimensions.topMargin + Math.floor(innerCardDimensions.height * 0.04);
      this.addChild(mesaLabel);

      // rank + suit side by side, bottom left
      const rankFontSize = Math.floor(innerCardDimensions.height * 0.6);
      const suitFontSize = Math.floor(innerCardDimensions.height);

      const suitText = new Text({
        text: SUIT_SYMBOLS[this.card.suit],
        style: { fontSize: suitFontSize, fill: SUIT_COLORS[this.card.suit], fontWeight: 'bold' },
      });
      suitText.anchor.set(1, 1);
      suitText.x = Math.floor(innerCardDimensions.width * 0.94);
      suitText.y = Math.floor(innerCardDimensions.height * 1.1);
      this.addChild(suitText);

      const rankText = new Text({
        text: this.card.rank,
        style: { fontSize: rankFontSize, fill: SUIT_COLORS[this.card.suit], fontWeight: 'bold' },
      });
      rankText.anchor.set(1, 1);
      rankText.x = Math.floor(innerCardDimensions.width * 0.94) - suitText.width;
      rankText.y = innerCardDimensions.height;
      this.addChild(rankText);
    } else {
      // Rank top-left, suit bottom-right — fonts proportional to card height
      const rankFontSize = Math.floor(innerCardDimensions.height * 0.55);
      const suitFontSize = Math.floor(innerCardDimensions.height * 0.65);

      const rankText = new Text({
        text: this.card.rank,
        style: { fontSize: rankFontSize, fill: SUIT_COLORS[this.card.suit], fontWeight: 'bold' },
      });
      rankText.anchor.set(0, 0);
      rankText.x = innerCardDimensions.sideMargin + Math.floor(innerCardDimensions.width * 0.04);
      rankText.y = innerCardDimensions.topMargin + Math.floor(innerCardDimensions.height * 0);
      this.addChild(rankText);

      const suitText = new Text({
        text: SUIT_SYMBOLS[this.card.suit],
        style: { fontSize: suitFontSize, fill: SUIT_COLORS[this.card.suit] },
      });
      suitText.anchor.set(1, 1);
      suitText.x = innerCardDimensions.sideMargin + innerCardDimensions.width - Math.floor(innerCardDimensions.width * 0.04);
      suitText.y = innerCardDimensions.topMargin + innerCardDimensions.height - Math.floor(innerCardDimensions.height * -0.05);
      this.addChild(suitText);
    }

    if (this.isWinnerCard) {
      if (!this.stars) {
        this.stars = new Graphics();
        this.addChild(this.stars);
      }

      this.stars.clear();

      const posMapper = (x: number, y: number) => ({
        x: innerCardDimensions.sideMargin + innerCardDimensions.width * x,
        y: innerCardDimensions.topMargin + innerCardDimensions.height * y,
      })
      const positions = [
        posMapper(0.1, 0.05),
        posMapper(0.50, 0.01),
        posMapper(0.9, 0.05),
        posMapper(1, 0.50),
        posMapper(0, 0.50),
        posMapper(0.9, 0.95),
        posMapper(0.50, 1.01),
        posMapper(0.1, 0.95),
      ];

      positions.forEach(pos => {
        this.stars!.star(pos.x, pos.y, 5, 8, 4, 0);
        this.stars!.fill(CARD_WINNER);
      });
    }
  }

  setPlayedCardColor(color: number | null): void {
    this.playedCardColor = color;
    this.render();
  }

  setClickable(clickable: boolean): void {
    this.eventMode = clickable ? 'static' : 'auto';
    this.cursor = clickable ? 'pointer' : 'default';
  }

  setHighlight(highlight: 'none' | 'highlight' | 'red'): void {
    this.currentHighlight = highlight;
    this.render();
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
    this.isWinnerCard = true;
    this.render();
  }

  getCard(): CardType {
    return this.card;
  }
}
