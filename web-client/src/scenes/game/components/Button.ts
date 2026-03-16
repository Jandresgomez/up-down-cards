import { Container, Graphics, Text } from 'pixi.js';

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;

  constructor(text: string, width: number = 200, height: number = 60, color: number = 0x2a9d8f) {
    super();

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, width, height, 10);
    this.bg.fill(color);
    this.bg.stroke({ width: 2, color: 0xffffff });
    this.addChild(this.bg);

    this.labelText = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = width / 2;
    this.labelText.y = height / 2;
    this.addChild(this.labelText);

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  setText(text: string): void {
    this.labelText.text = text;
  }

  setColor(color: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.bg.width, this.bg.height, 10);
    this.bg.fill(color);
    this.bg.stroke({ width: 2, color: 0xffffff });
  }
}
