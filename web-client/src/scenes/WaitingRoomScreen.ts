import { Container, Graphics, Text } from 'pixi.js';

export class WaitingRoomScreen {
  private container: Container;
  private isAdmin: boolean;
  private numberOfPlayers: number;
  private numberOfRounds: number;
  private maxRounds: number;
  private onStartGame: (rounds: number) => void;
  private roundsText: Text;

  constructor(
    roomId: string,
    isAdmin: boolean,
    numberOfPlayers: number,
    numberOfRounds: number,
    maxRounds: number,
    onStartGame: (rounds: number) => void
  ) {
    this.container = new Container();
    this.isAdmin = isAdmin;
    this.numberOfPlayers = numberOfPlayers;
    this.numberOfRounds = numberOfRounds;
    this.maxRounds = maxRounds;
    this.onStartGame = onStartGame;
    
    this.roundsText = new Text({
      text: '',
      style: { fontSize: 32, fill: 0xffffff, fontWeight: 'bold' }
    });
    
    this.createUI(roomId);
  }

  private createUI(roomId: string): void {
    // Title
    const title = new Text({
      text: 'Waiting Room',
      style: { fontSize: 48, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = window.innerWidth / 2;
    title.y = 100;
    this.container.addChild(title);

    // Room ID
    const roomText = new Text({
      text: `Room: ${roomId}`,
      style: { fontSize: 28, fill: 0xaaaaaa }
    });
    roomText.anchor.set(0.5);
    roomText.x = window.innerWidth / 2;
    roomText.y = 170;
    this.container.addChild(roomText);

    // Players count
    const playersText = new Text({
      text: `Players: ${this.numberOfPlayers}`,
      style: { fontSize: 24, fill: 0xffffff }
    });
    playersText.anchor.set(0.5);
    playersText.x = window.innerWidth / 2;
    playersText.y = 250;
    this.container.addChild(playersText);

    if (this.isAdmin) {
      this.createAdminControls();
    } else {
      const waitingText = new Text({
        text: 'Waiting for admin to start the game...',
        style: { fontSize: 24, fill: 0xaaaaaa }
      });
      waitingText.anchor.set(0.5);
      waitingText.x = window.innerWidth / 2;
      waitingText.y = 400;
      this.container.addChild(waitingText);
    }
  }

  private createAdminControls(): void {
    // Rounds label
    const roundsLabel = new Text({
      text: 'Number of Rounds:',
      style: { fontSize: 24, fill: 0xffffff }
    });
    roundsLabel.anchor.set(0.5);
    roundsLabel.x = window.innerWidth / 2;
    roundsLabel.y = 330;
    this.container.addChild(roundsLabel);

    // Rounds display
    this.roundsText.text = `${this.numberOfRounds}`;
    this.roundsText.anchor.set(0.5);
    this.roundsText.x = window.innerWidth / 2;
    this.roundsText.y = 390;
    this.container.addChild(this.roundsText);

    // Decrease button
    const decreaseBtn = this.createButton('-', window.innerWidth / 2 - 200, 360);
    decreaseBtn.eventMode = 'static';
    decreaseBtn.cursor = 'pointer';
    decreaseBtn.on('pointerdown', () => this.changeRounds(-1));
    this.container.addChild(decreaseBtn);

    // Increase button
    const increaseBtn = this.createButton('+', window.innerWidth / 2 + 140, 360);
    increaseBtn.eventMode = 'static';
    increaseBtn.cursor = 'pointer';
    increaseBtn.on('pointerdown', () => this.changeRounds(1));
    this.container.addChild(increaseBtn);

    // Max rounds info
    const maxRoundsText = new Text({
      text: `(Max: ${this.maxRounds})`,
      style: { fontSize: 18, fill: 0xaaaaaa }
    });
    maxRoundsText.anchor.set(0.5);
    maxRoundsText.x = window.innerWidth / 2;
    maxRoundsText.y = 440;
    this.container.addChild(maxRoundsText);

    // Start button
    const startBtn = this.createButton('Start Game', window.innerWidth / 2 - 150, 500);
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.on('pointerdown', () => this.onStartGame(this.numberOfRounds));
    this.container.addChild(startBtn);
  }

  private createButton(text: string, x: number, y: number): Container {
    const btn = new Container();
    
    const width = text.length === 1 ? 60 : 300;
    const bg = new Graphics();
    bg.roundRect(0, 0, width, 60, 10);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 2, color: 0xffffff });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = 30;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;

    return btn;
  }

  private changeRounds(delta: number): void {
    this.numberOfRounds = Math.max(1, Math.min(this.numberOfRounds + delta, this.maxRounds));
    this.roundsText.text = `${this.numberOfRounds}`;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
