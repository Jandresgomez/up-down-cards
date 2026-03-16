import { Container, Graphics, Text } from 'pixi.js';
import { Card as CardType } from '../../../types/game-types';
import { getResponsiveSizes, getMesaCardDimensions } from '../../../utils/responsive';
import { Button } from './Button';
import { Card } from './Card';

export class BettingControls extends Container {
  private bg: Graphics;
  private title: Text;
  private mesaContainer: Container;

  // My-turn controls
  private betText: Text;
  private warningText: Text;
  private decreaseBtn: Button;
  private confirmBtn: Button;
  private increaseBtn: Button;
  private buttonsContainer: Container;

  // Waiting state
  private waitingText: Text;

  private isMyTurn: boolean;
  private validBets: number[];
  private maxBet: number;
  private currentBet: number = 0;
  private onConfirm: (bet: number) => void;

  constructor(
    isMyTurn: boolean,
    validBets: number[],
    maxBet: number,
    mesa: CardType | null,
    onConfirm: (bet: number) => void
  ) {
    super();
    this.isMyTurn = isMyTurn;
    this.validBets = validBets;
    this.maxBet = maxBet;
    this.onConfirm = onConfirm;

    const sizes = getResponsiveSizes();

    this.bg = new Graphics();

    this.mesaContainer = new Container();
    this.buildMesa(mesa);

    this.title = new Text({
      text: isMyTurn ? 'Its your turn to bet!' : 'Waiting...',
      style: { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' },
    });
    this.title.anchor.set(0.5, 0);

    this.betText = new Text({
      text: '0',
      style: { fontSize: sizes.titleSize, fill: 0xffffff, fontWeight: 'bold' },
    });
    this.betText.anchor.set(0.5);

    this.warningText = new Text({
      text: '',
      style: { fontSize: sizes.smallFontSize, fill: 0xff6b6b },
    });
    this.warningText.anchor.set(0.5);

    this.waitingText = new Text({
      text: 'Others are betting,\nplease wait for your turn!',
      style: { fontSize: sizes.smallFontSize, fill: 0xaaaaaa, align: 'center' },
    });
    this.waitingText.anchor.set(0.5);

    const btnW = sizes.buttonSmall.width;
    const btnH = sizes.buttonSmall.height;
    this.decreaseBtn = new Button('-', btnW, btnH);
    this.confirmBtn = new Button('Confirm', 120, btnH, 0x4caf50);
    this.increaseBtn = new Button('+', btnW, btnH);
    this.buttonsContainer = new Container();

    this.buildChildren();
    this.updateWarning();
  }

  private buildMesa(mesa: CardType | null): void {
    if (!mesa) return;
    const mesaDims = getMesaCardDimensions();
    const cardComponent = new Card(mesa, mesaDims.width, mesaDims.height, true);
    this.mesaContainer.addChild(cardComponent);
  }

  private buildChildren(): void {
    this.addChild(this.bg);
    this.addChild(this.mesaContainer);
    this.addChild(this.title);

    if (this.isMyTurn) {
      this.decreaseBtn.on('pointerdown', () => this.changeBet(-1));
      this.increaseBtn.on('pointerdown', () => this.changeBet(1));
      this.confirmBtn.on('pointerdown', () => this.confirm());

      this.buttonsContainer.addChild(this.decreaseBtn);
      this.buttonsContainer.addChild(this.confirmBtn);
      this.buttonsContainer.addChild(this.increaseBtn);

      this.addChild(this.betText);
      this.addChild(this.buttonsContainer);
      this.addChild(this.warningText);
    } else {
      this.addChild(this.waitingText);
    }
  }

  layout(width: number): void {
    const sizes = getResponsiveSizes();

    let ySize = sizes.padding;

    const mesaDims = getMesaCardDimensions();
    this.mesaContainer.x = sizes.padding;
    this.mesaContainer.y = sizes.padding; // fixed pos

    const centerX = Math.floor(width / 2);

    // title in the middle
    this.title.anchor.set(0.5, 0);
    this.title.x = centerX;
    this.title.y = ySize;
    ySize += this.title.height;

    if (this.isMyTurn) {
      const btnW = sizes.buttonSmall.width;
      const btnH = sizes.buttonSmall.height;
      const confirmWidth = 120;
      const gap = sizes.spacing;
      const totalWidth = btnW + gap + confirmWidth + gap + btnW;

      this.betText.x = centerX;
      this.betText.y = ySize + (2 * sizes.spacing);
      ySize += this.betText.height + (2 * sizes.spacing);

      this.decreaseBtn.x = 0;
      this.confirmBtn.x = btnW + gap;
      this.increaseBtn.x = btnW + gap + confirmWidth + gap;
      this.buttonsContainer.x = centerX - totalWidth / 2;
      this.buttonsContainer.y = ySize + sizes.spacing;
      ySize += this.buttonsContainer.height + sizes.spacing;


      this.warningText.x = centerX;
      this.warningText.y = ySize + sizes.spacing;
      ySize += this.warningText.height + sizes.spacing;
    } else {
      this.waitingText.x = centerX;
      this.waitingText.y = ySize + 4 * sizes.spacing;
      ySize += this.waitingText.height + 4 * sizes.spacing;
    }

    this.bg.clear();
    this.bg.roundRect(0, 0, width, Math.max(ySize, 200), 15);
    this.bg.fill(0x1a1a2e);
    this.bg.stroke({ width: 3, color: this.isMyTurn ? 0x4caf50 : 0x666666 });
  }

  private changeBet(delta: number): void {
    const next = this.currentBet + delta;
    if (next < 0) this.currentBet = this.maxBet;
    else if (next > this.maxBet) this.currentBet = 0;
    else this.currentBet = next;
    this.betText.text = `${this.currentBet}`;
    this.updateWarning();
  }

  private updateWarning(): void {
    this.warningText.text = this.validBets.includes(this.currentBet)
      ? ''
      : `Bet value is invalid`;
  }

  private confirm(): void {
    if (this.validBets.includes(this.currentBet)) {
      this.onConfirm(this.currentBet);
    } else {
      this.shake();
    }
  }

  private shake(): void {
    const original = this.rotation;
    const angle = (5 * Math.PI) / 180;
    let step = 0;
    const interval = setInterval(() => {
      if (step >= 6) {
        this.rotation = original;
        clearInterval(interval);
        return;
      }
      this.rotation = original + (step % 2 === 0 ? angle : -angle);
      step++;
    }, 50);
  }
}
