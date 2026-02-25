import { Container, Graphics, Text } from 'pixi.js';
import { Button } from './Button';
import { getResponsiveSizes } from '../../../utils/responsive';

export class BettingUI extends Container {
  private currentBet: number = 0;
  private maxBet: number = 0;
  private validBets: number[] = [];
  private betText: Text;
  private warningText: Text;
  private onConfirm: (bet: number) => void;
  private bg: Graphics;
  private title: Text;
  private decreaseBtn: Button;
  private increaseBtn: Button;
  private confirmBtn: Button;

  constructor(validBets: number[], onConfirm: (bet: number) => void) {
    super();
    this.validBets = validBets;
    this.maxBet = Math.max(...validBets);
    this.currentBet = 0;
    this.onConfirm = onConfirm;

    const sizes = getResponsiveSizes();
    const panelWidth = Math.min(400, sizes.width * 0.9);
    const panelHeight = sizes.isMobile ? 240 : 260;

    // Background panel
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, panelWidth, panelHeight, 15);
    this.bg.fill(0x1a1a2e);
    this.bg.stroke({ width: 3, color: 0x4caf50 });
    this.addChild(this.bg);

    // Title
    this.title = new Text({
      text: 'Place Your Bet',
      style: { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.title.anchor.set(0.5);
    this.title.x = panelWidth / 2;
    this.title.y = sizes.spacing;
    this.addChild(this.title);

    // Bet display
    this.betText = new Text({
      text: '0',
      style: { fontSize: sizes.isMobile ? 40 : 48, fill: 0x4caf50, fontWeight: 'bold' }
    });
    this.betText.anchor.set(0.5);
    this.betText.x = panelWidth / 2;
    this.betText.y = sizes.isMobile ? 80 : 100;
    this.addChild(this.betText);

    // Button row
    const btnY = sizes.isMobile ? 140 : 150;
    const btnSize = sizes.buttonSmall.width;
    const confirmWidth = sizes.isMobile ? 100 : 120;
    const spacing = 10;
    
    // Calculate positions to center the button group
    const totalWidth = btnSize + spacing + confirmWidth + spacing + btnSize;
    const startX = (panelWidth - totalWidth) / 2;

    // Decrease button
    this.decreaseBtn = new Button('-', btnSize, btnSize);
    this.decreaseBtn.x = startX;
    this.decreaseBtn.y = btnY;
    this.decreaseBtn.on('pointerdown', () => this.changeBet(-1));
    this.addChild(this.decreaseBtn);

    // Confirm button
    this.confirmBtn = new Button('Confirm', confirmWidth, sizes.buttonSmall.height, 0x4caf50);
    this.confirmBtn.x = startX + btnSize + spacing;
    this.confirmBtn.y = btnY;
    this.confirmBtn.on('pointerdown', () => this.confirm());
    this.addChild(this.confirmBtn);

    // Increase button
    this.increaseBtn = new Button('+', btnSize, btnSize);
    this.increaseBtn.x = startX + btnSize + spacing + confirmWidth + spacing;
    this.increaseBtn.y = btnY;
    this.increaseBtn.on('pointerdown', () => this.changeBet(1));
    this.addChild(this.increaseBtn);

    // Warning text
    this.warningText = new Text({
      text: '',
      style: { fontSize: sizes.smallFontSize, fill: 0xff6b6b }
    });
    this.warningText.anchor.set(0.5);
    this.warningText.x = panelWidth / 2;
    this.warningText.y = btnY + sizes.buttonSmall.height + 20;
    this.addChild(this.warningText);
    
    this.updateWarning();
    this.positionCenter();
    
    window.addEventListener('resize', () => this.positionCenter());
  }

  private positionCenter(): void {
    this.x = (window.innerWidth - this.bg.width) / 2;
    this.y = (window.innerHeight - this.bg.height) / 2;
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
