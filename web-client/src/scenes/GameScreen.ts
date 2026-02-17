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

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
