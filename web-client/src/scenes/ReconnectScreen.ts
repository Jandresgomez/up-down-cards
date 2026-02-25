import { Container, Graphics, Text } from 'pixi.js';
import { isMobile, vh, vw } from '../utils/responsive';

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
    const mobile = isMobile();
    const centerX = window.innerWidth / 2;

    // Title
    const title = new Text({
      text: 'Previous Game Found',
      style: { fontSize: mobile ? 32 : 48, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = centerX;
    title.y = mobile ? vh(20) : 200;
    this.container.addChild(title);

    // Message
    const message = new Text({
      text: `You were in room: ${roomId}`,
      style: { fontSize: mobile ? 20 : 28, fill: 0xaaaaaa }
    });
    message.anchor.set(0.5);
    message.x = centerX;
    message.y = title.y + (mobile ? 60 : 80);
    this.container.addChild(message);

    const question = new Text({
      text: 'Would you like to reconnect?',
      style: { fontSize: mobile ? 18 : 24, fill: 0xaaaaaa }
    });
    question.anchor.set(0.5);
    question.x = centerX;
    question.y = message.y + (mobile ? 50 : 60);
    this.container.addChild(question);

    // Buttons
    const btnWidth = mobile ? 160 : 200;
    const btnHeight = mobile ? 50 : 60;
    const btnSpacing = mobile ? 20 : 50;

    if (mobile) {
      // Stack buttons vertically on mobile
      const reconnectBtn = this.createButton('Reconnect', centerX - btnWidth / 2, question.y + 60, 0x4caf50, btnWidth, btnHeight);
      reconnectBtn.eventMode = 'static';
      reconnectBtn.cursor = 'pointer';
      reconnectBtn.on('pointerdown', onReconnect);
      this.container.addChild(reconnectBtn);

      const menuBtn = this.createButton('Main Menu', centerX - btnWidth / 2, question.y + 130, 0x666666, btnWidth, btnHeight);
      menuBtn.eventMode = 'static';
      menuBtn.cursor = 'pointer';
      menuBtn.on('pointerdown', onMainMenu);
      this.container.addChild(menuBtn);
    } else {
      // Side by side on desktop
      const reconnectBtn = this.createButton('Reconnect', centerX - btnWidth - btnSpacing / 2, question.y + 80, 0x4caf50, btnWidth, btnHeight);
      reconnectBtn.eventMode = 'static';
      reconnectBtn.cursor = 'pointer';
      reconnectBtn.on('pointerdown', onReconnect);
      this.container.addChild(reconnectBtn);

      const menuBtn = this.createButton('Main Menu', centerX + btnSpacing / 2, question.y + 80, 0x666666, btnWidth, btnHeight);
      menuBtn.eventMode = 'static';
      menuBtn.cursor = 'pointer';
      menuBtn.on('pointerdown', onMainMenu);
      this.container.addChild(menuBtn);
    }
  }

  private createButton(text: string, x: number, y: number, color: number, width: number, height: number): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 10);
    bg.fill(color);
    bg.stroke({ width: 2, color: 0xffffff });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: isMobile() ? 18 : 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;
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
