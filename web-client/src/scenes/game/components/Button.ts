import { Container, Graphics, Text } from 'pixi.js';

export class Button extends Container {
  private bg: Graphics;
  private label: Text;

  constructor(text: string, width: number = 200, height: number = 60, color: number = 0x2a9d8f) {
    super();

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, width, height, 10);
    this.bg.fill(color);
    this.bg.stroke({ width: 2, color: 0xffffff });
    this.addChild(this.bg);

    this.label = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.label.anchor.set(0.5);
    this.label.x = width / 2;
    this.label.y = height / 2;
    this.addChild(this.label);

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  setText(text: string): void {
    this.label.text = text;
  }

  setColor(color: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.bg.width, this.bg.height, 10);
    this.bg.fill(color);
    this.bg.stroke({ width: 2, color: 0xffffff });
  }
}
