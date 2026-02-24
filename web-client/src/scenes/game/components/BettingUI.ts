import { Container, Graphics, Text } from 'pixi.js';
import { Button } from './Button';

export class BettingUI extends Container {
  private currentBet: number = 0;
  private maxBet: number = 0;
  private validBets: number[] = [];
  private betText: Text;
  private warningText: Text;
  private onConfirm: (bet: number) => void;

  constructor(validBets: number[], onConfirm: (bet: number) => void) {
    super();
    this.validBets = validBets;
    this.maxBet = Math.max(...validBets);
    this.currentBet = 0;
    this.onConfirm = onConfirm;

    // Background panel
    const bg = new Graphics();
    bg.roundRect(0, 0, 400, 200, 15);
    bg.fill(0x1a1a2e);
    bg.stroke({ width: 3, color: 0x4caf50 });
    this.addChild(bg);

    // Title
    const title = new Text({
      text: 'Place Your Bet',
      style: { fontSize: 28, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = 200;
    title.y = 30;
    this.addChild(title);

    // Bet display
    this.betText = new Text({
      text: '0',
      style: { fontSize: 48, fill: 0x4caf50, fontWeight: 'bold' }
    });
    this.betText.anchor.set(0.5);
    this.betText.x = 200;
    this.betText.y = 90;
    this.addChild(this.betText);

    // Decrease button
    const decreaseBtn = new Button('-', 60, 60);
    decreaseBtn.x = 80;
    decreaseBtn.y = 120;
    decreaseBtn.on('pointerdown', () => this.changeBet(-1));
    this.addChild(decreaseBtn);

    // Increase button
    const increaseBtn = new Button('+', 60, 60);
    increaseBtn.x = 260;
    increaseBtn.y = 120;
    increaseBtn.on('pointerdown', () => this.changeBet(1));
    this.addChild(increaseBtn);

    // Confirm button
    const confirmBtn = new Button('Confirm', 150, 50, 0x4caf50);
    confirmBtn.x = 125;
    confirmBtn.y = 200;
    confirmBtn.on('pointerdown', () => this.confirm());
    this.addChild(confirmBtn);

    // Warning text
    this.warningText = new Text({
      text: '',
      style: { fontSize: 16, fill: 0xff6b6b }
    });
    this.warningText.anchor.set(0.5);
    this.warningText.x = 200;
    this.warningText.y = 270;
    this.addChild(this.warningText);
  }

  private changeBet(delta: number): void {
    this.currentBet = Math.max(0, Math.min(this.currentBet + delta, this.maxBet));
    this.betText.text = `${this.currentBet}`;
    this.updateWarning();
  }

  private updateWarning(): void {
    if (!this.validBets.includes(this.currentBet)) {
      this.warningText.text = 'Invalid bet!';
    } else {
      this.warningText.text = '';
    }
  }

  private confirm(): void {
    if (this.validBets.includes(this.currentBet)) {
      this.onConfirm(this.currentBet);
    }
  }
}
