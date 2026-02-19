import { Container, Graphics, Text } from 'pixi.js';

export class WaitingRoomScreen {
  private container: Container;
  private isAdmin: boolean;
  private numberOfPlayers: number;
  private numberOfRounds: number;
  private maxPlayers: number;
  private maxRounds: number;
  private onRoundsChange: (rounds: number) => void;
  private onStartGame: () => void;
  private roundsText: Text;
  private playersText: Text;

  constructor(
    roomId: string,
    isAdmin: boolean,
    numberOfPlayers: number,
    numberOfRounds: number,
    maxRounds: number,
    onRoundsChange: (rounds: number) => void,
    onStartGame: () => void
  ) {
    this.container = new Container();
    this.isAdmin = isAdmin;
    this.numberOfPlayers = numberOfPlayers;
    this.numberOfRounds = numberOfRounds;
    this.maxPlayers = 4;
    this.maxRounds = maxRounds;
    this.onRoundsChange = onRoundsChange;
    this.onStartGame = onStartGame;

    this.roundsText = new Text({
      text: '',
      style: { fontSize: 32, fill: 0xffffff, fontWeight: 'bold' }
    });

    this.playersText = new Text({
      text: '',
      style: { fontSize: 24, fill: 0xffffff }
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
    roomText.x = window.innerWidth / 2 - 60;
    roomText.y = 170;
    this.container.addChild(roomText);

    // Copy button
    const copyBtn = this.createCopyButton(roomId, window.innerWidth / 2 + 120, 155);
    this.container.addChild(copyBtn);

    // Players count
    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
    this.playersText.anchor.set(0.5);
    this.playersText.x = window.innerWidth / 2;
    this.playersText.y = 250;
    this.container.addChild(this.playersText);

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
    startBtn.on('pointerdown', () => this.onStartGame());
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
    this.onRoundsChange(this.numberOfRounds);
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

  updatePlayers(count: number): void {
    this.numberOfPlayers = count;
    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
  }

  updateSettings(rounds: number, maxPlayers: number): void {
    this.numberOfRounds = rounds;
    this.maxPlayers = maxPlayers;
    this.roundsText.text = `${this.numberOfRounds}`;
    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
