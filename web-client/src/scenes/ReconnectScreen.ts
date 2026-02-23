import { Container, Graphics, Text } from 'pixi.js';

export class ReconnectScreen {
  private container: Container;

  constructor(
    roomId: string,
    onReconnect: () => void,
    onMainMenu: () => void
  ) {
    this.container = new Container();
    this.createUI(roomId, onReconnect, onMainMenu);
  }

  private createUI(roomId: string, onReconnect: () => void, onMainMenu: () => void): void {
    // Title
    const title = new Text({
      text: 'Previous Game Found',
      style: { fontSize: 48, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = window.innerWidth / 2;
    title.y = 200;
    this.container.addChild(title);

    // Message
    const message = new Text({
      text: `You were in room: ${roomId}`,
      style: { fontSize: 28, fill: 0xaaaaaa }
    });
    message.anchor.set(0.5);
    message.x = window.innerWidth / 2;
    message.y = 280;
    this.container.addChild(message);

    const question = new Text({
      text: 'Would you like to reconnect?',
      style: { fontSize: 24, fill: 0xaaaaaa }
    });
    question.anchor.set(0.5);
    question.x = window.innerWidth / 2;
    question.y = 340;
    this.container.addChild(question);

    // Reconnect button
    const reconnectBtn = this.createButton('Reconnect', window.innerWidth / 2 - 250, 420, 0x4caf50);
    reconnectBtn.eventMode = 'static';
    reconnectBtn.cursor = 'pointer';
    reconnectBtn.on('pointerdown', onReconnect);
    this.container.addChild(reconnectBtn);

    // Main menu button
    const menuBtn = this.createButton('Main Menu', window.innerWidth / 2 + 50, 420, 0x666666);
    menuBtn.eventMode = 'static';
    menuBtn.cursor = 'pointer';
    menuBtn.on('pointerdown', onMainMenu);
    this.container.addChild(menuBtn);
  }

  private createButton(text: string, x: number, y: number, color: number): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 200, 60, 10);
    bg.fill(color);
    bg.stroke({ width: 2, color: 0xffffff });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = 100;
    label.y = 30;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;

    return btn;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
