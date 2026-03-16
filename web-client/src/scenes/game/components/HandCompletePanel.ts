import { Container, Text } from 'pixi.js';
import { isMobile } from '../../../utils/responsive';
import { Button } from './Button';

export class HandCompletePanel extends Container {
  private winnerText: Text;
  private readyText: Text;
  private continueBtn: Button;

  constructor(
    winnerLabel: string,
    readyCount: number,
    totalPlayers: number,
    hasClicked: boolean,
    onContinue: () => void
  ) {
    super();
    const mobile = isMobile();

    this.winnerText = new Text({
      text: `${winnerLabel} wins this Hand!`,
      style: { fontSize: mobile ? 24 : 32, fill: 0xffd700, fontWeight: 'bold' },
    });
    this.winnerText.anchor.set(0.5, 0);

    this.readyText = new Text({
      text: `${readyCount}/${totalPlayers}`,
      style: { fontSize: 24, fill: 0xaaaaaa },
    });
    this.readyText.anchor.set(0.5, 0);

    this.continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      200, 60,
      hasClicked ? 0x666666 : 0x4caf50
    );
    if (!hasClicked) {
      this.continueBtn.on('pointerdown', onContinue);
    }

    this.addChild(this.winnerText);
    this.addChild(this.readyText);
    this.addChild(this.continueBtn);
  }

  layout(width: number): void {
    this.winnerText.x = width / 2;
    this.winnerText.y = 0;

    this.readyText.x = width / 2;
    this.readyText.y = this.winnerText.height + 10;

    this.continueBtn.x = width / 2 - 100;
    this.continueBtn.y = this.winnerText.height + this.readyText.height + 20;
  }
}
