import { Container, Graphics, Text } from 'pixi.js';
import { CardValue } from '../state/GameState';

export class GameScreen {
  private container: Container;
  private table: Graphics;
  private handContainer: Container;
  private roomIdText: Text;
  private roundText: Text;

  constructor(roomId: string, currentRound: number, totalRounds: number) {
    this.container = new Container();
    this.table = new Graphics();
    this.handContainer = new Container();
    
    // Room ID display
    this.roomIdText = new Text({
      text: `Room: ${roomId}`,
      style: { fontSize: 28, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.roomIdText.x = 20;
    this.roomIdText.y = 20;

    // Copy button
    const copyBtn = this.createCopyButton(roomId, 220, 15);
    this.container.addChild(copyBtn);
    
    // Round display
    this.roundText = new Text({
      text: `Round ${currentRound}/${totalRounds}`,
      style: { fontSize: 28, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.roundText.anchor.set(1, 0);
    
    this.createUI();
  }

  private createUI(): void {
    this.container.addChild(this.table);
    this.container.addChild(this.roomIdText);
    this.container.addChild(this.roundText);
    this.container.addChild(this.handContainer);
    this.resizeGame();
  }

  resizeGame(): void {
    this.table.clear();
    this.table.roundRect(100, 100, window.innerWidth - 200, window.innerHeight - 300, 20);
    this.table.fill(0x0f3d3e);
    this.table.stroke({ width: 3, color: 0x2a9d8f });

    this.handContainer.x = (window.innerWidth - 600) / 2;
    this.handContainer.y = window.innerHeight - 180;
    
    // Position round text at top right
    this.roundText.x = window.innerWidth - 20;
    this.roundText.y = 20;
  }

  updateHand(hand: CardValue[]): void {
    this.handContainer.removeChildren();

    hand.forEach((cardValue, index) => {
      const card = this.createCard(cardValue);
      card.x = index * 120;
      card.eventMode = 'static';
      card.cursor = 'pointer';

      card.on('pointerover', () => {
        card.y = -20;
      });

      card.on('pointerout', () => {
        card.y = 0;
      });

      this.handContainer.addChild(card);
    });
  }

  private createCard(value: CardValue): Container {
    const cardContainer = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, 100, 140, 10);
    bg.fill(0xffffff);
    bg.stroke({ width: 2, color: 0x333333 });
    cardContainer.addChild(bg);

    const isRed = value.includes('♥') || value.includes('♦');
    const text = new Text({
      text: value,
      style: {
        fontSize: 32,
        fill: isRed ? 0xff0000 : 0x000000,
        fontWeight: 'bold'
      }
    });
    text.anchor.set(0.5);
    text.x = 50;
    text.y = 70;
    cardContainer.addChild(text);

    return cardContainer;
  }

  private createCopyButton(roomId: string, x: number, y: number): Container {
    const btn = new Container();
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 80, 40, 8);
    bg.fill(0x4a5568);
    bg.stroke({ width: 2, color: 0x718096 });
    btn.addChild(bg);

    const label = new Text({
      text: 'Copy',
      style: { fontSize: 18, fill: 0xffffff }
    });
    label.anchor.set(0.5);
    label.x = 40;
    label.y = 20;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    btn.on('pointerdown', async () => {
      try {
        await navigator.clipboard.writeText(roomId);
        label.text = 'Copied!';
        setTimeout(() => { label.text = 'Copy'; }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

    return btn;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
