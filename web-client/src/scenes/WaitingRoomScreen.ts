import { Container, Graphics, Text } from 'pixi.js';
import { getResponsiveSizes } from '../utils/responsive';

export class WaitingRoomScreen {
  private container: Container;
  private isAdmin: boolean;
  private numberOfPlayers: number;
  private numberOfRounds: number;
  private maxPlayers: number;
  private maxRounds: number;
  private onRoundsChange: (rounds: number) => void;
  private onStartGame: () => void;
  private onLeaveRoom: () => void;
  private onCloseRoom: () => void;
  private roundsText: Text;
  private playersText: Text;
  private maxRoundsText: Text | null = null;
  private title: Text;
  private roomText: Text;
  private copyBtn: Container;
  private roomId: string;
  private adminControls: Container[] = [];
  private nonAdminControls: Container[] = [];

  constructor(
    roomId: string,
    isAdmin: boolean,
    numberOfPlayers: number,
    numberOfRounds: number,
    maxRounds: number,
    onRoundsChange: (rounds: number) => void,
    onStartGame: () => void,
    onLeaveRoom: () => void,
    onCloseRoom: () => void
  ) {
    this.container = new Container();
    this.roomId = roomId;
    this.isAdmin = isAdmin;
    this.numberOfPlayers = numberOfPlayers;
    this.numberOfRounds = numberOfRounds;
    this.maxPlayers = 6;
    this.maxRounds = maxRounds;
    this.onRoundsChange = onRoundsChange;
    this.onStartGame = onStartGame;
    this.onLeaveRoom = onLeaveRoom;
    this.onCloseRoom = onCloseRoom;

    this.roundsText = new Text({
      text: '',
      style: { fontSize: 32, fill: 0xffffff, fontWeight: 'bold' }
    });

    this.playersText = new Text({
      text: '',
      style: { fontSize: 24, fill: 0xffffff }
    });

    this.title = new Text({
      text: 'Waiting Room',
      style: { fontSize: 48, fill: 0xffffff, fontWeight: 'bold' }
    });

    this.roomText = new Text({
      text: `Room: ${roomId}`,
      style: { fontSize: 28, fill: 0xaaaaaa }
    });

    this.copyBtn = this.createCopyButton(roomId);

    this.createUI(roomId);
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  private getScreenResponsiveSizes() {
    const base = getResponsiveSizes();
    return {
      ...base,
      roundsSize: base.isMobile ? 24 : 32,
    };
  }

  private createUI(roomId: string): void {
    // Title
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    // Room ID
    this.roomText.anchor.set(0.5);
    this.container.addChild(this.roomText);

    // Copy button
    this.container.addChild(this.copyBtn);

    // Players count
    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
    this.playersText.anchor.set(0.5);
    this.container.addChild(this.playersText);

    if (this.isAdmin) {
      this.createAdminControls();
    } else {
      this.createNonAdminControls();
    }
  }

  private createNonAdminControls(): void {
    const waitingText = new Text({
      text: 'Waiting for admin to start the game...',
      style: { fontSize: 24, fill: 0xaaaaaa }
    });
    waitingText.anchor.set(0.5);
    this.container.addChild(waitingText);
    this.nonAdminControls.push(waitingText);

    // Leave room button for non-admin
    const leaveBtn = this.createButton('Leave Room', 300, 60);
    leaveBtn.eventMode = 'static';
    leaveBtn.cursor = 'pointer';
    leaveBtn.on('pointerdown', () => this.onLeaveRoom());
    this.container.addChild(leaveBtn);
    this.nonAdminControls.push(leaveBtn);
  }

  private resize(): void {
    const sizes = this.getScreenResponsiveSizes();
    const centerX = sizes.width / 2;
    let currentY = sizes.height * 0.15;

    // Title
    this.title.style.fontSize = sizes.titleSize;
    this.title.x = centerX;
    this.title.y = currentY;
    currentY += this.title.height + sizes.spacing * 0.8;

    // Room ID
    this.roomText.style.fontSize = sizes.subtitleSize;
    this.roomText.x = centerX - (sizes.isMobile ? 30 : 60);
    this.roomText.y = currentY;

    // Copy button (aligned with room text)
    this.copyBtn.x = centerX + (sizes.isMobile ? 60 : 120);
    this.copyBtn.y = currentY - 20;
    currentY += this.roomText.height + sizes.spacing;

    // Players count
    this.playersText.style.fontSize = sizes.fontSize;
    this.playersText.x = centerX;
    this.playersText.y = currentY;
    currentY += this.playersText.height + sizes.spacing;

    if (this.isAdmin) {
      this.resizeAdminControls(centerX, currentY, sizes);
    } else {
      this.resizeNonAdminControls(centerX, currentY, sizes);
    }
  }

  private resizeAdminControls(centerX: number, currentY: number, sizes: any): void {
    const controls = this.adminControls;

    // Rounds label (index 0)
    const roundsLabel = controls[0] as Text;
    roundsLabel.style.fontSize = sizes.fontSize;
    roundsLabel.x = centerX;
    roundsLabel.y = currentY;
    currentY += roundsLabel.height + sizes.spacing * 0.5;

    // Rounds display
    this.roundsText.style.fontSize = sizes.roundsSize;
    this.roundsText.x = centerX;
    this.roundsText.y = currentY;

    // Decrease button (index 1) - aligned with rounds text
    const decreaseBtn = controls[1];
    decreaseBtn.x = centerX - sizes.buttonSmall.width - sizes.spacing * 4;
    decreaseBtn.y = currentY - sizes.buttonSmall.height / 2 + this.roundsText.height / 2;
    this.updateButtonSize(decreaseBtn, sizes.buttonSmall.width, sizes.buttonSmall.height, sizes.fontSize);

    // Increase button (index 2) - aligned with rounds text
    const increaseBtn = controls[2];
    increaseBtn.x = centerX + sizes.spacing * 4;
    increaseBtn.y = currentY - sizes.buttonSmall.height / 2 + this.roundsText.height / 2;
    this.updateButtonSize(increaseBtn, sizes.buttonSmall.width, sizes.buttonSmall.height, sizes.fontSize);
    currentY += this.roundsText.height + sizes.spacing * 0.5;

    // Max rounds info (index 3)
    if (this.maxRoundsText) {
      this.maxRoundsText.style.fontSize = sizes.isMobile ? 14 : 18;
      this.maxRoundsText.x = centerX;
      this.maxRoundsText.y = currentY;
      currentY += this.maxRoundsText.height + sizes.spacing;
    }

    // Start button (index 4)
    const startBtn = controls[4];
    startBtn.x = centerX - sizes.buttonLarge.width / 2;
    startBtn.y = currentY;
    this.updateButtonSize(startBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
    currentY += sizes.buttonLarge.height + sizes.spacing * 0.5;

    // Close button (index 5)
    const closeBtn = controls[5];
    closeBtn.x = centerX - sizes.buttonLarge.width / 2;
    closeBtn.y = currentY;
    this.updateButtonSize(closeBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
  }

  private resizeNonAdminControls(centerX: number, currentY: number, sizes: any): void {
    // Waiting text
    const waitingText = this.nonAdminControls[0] as Text;
    waitingText.style.fontSize = sizes.fontSize;
    waitingText.x = centerX;
    waitingText.y = currentY;
    currentY += waitingText.height + sizes.spacing;

    // Leave button
    const leaveBtn = this.nonAdminControls[1];
    leaveBtn.x = centerX - sizes.buttonLarge.width / 2;
    leaveBtn.y = currentY;
    this.updateButtonSize(leaveBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
  }

  private updateButtonSize(btn: Container, width: number, height: number, fontSize: number): void {
    const bg = btn.getChildAt(0) as Graphics;
    const text = btn.getChildAt(1) as Text;

    bg.clear();
    bg.roundRect(0, 0, width, height, 10);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 2, color: 0xffffff });

    text.style.fontSize = fontSize;
    text.x = width / 2;
    text.y = height / 2;
  }

  private createAdminControls(): void {
    // Rounds label
    const roundsLabel = new Text({
      text: 'Number of Rounds:',
      style: { fontSize: 24, fill: 0xffffff }
    });
    roundsLabel.anchor.set(0.5);
    this.container.addChild(roundsLabel);
    this.adminControls.push(roundsLabel);

    // Rounds display
    this.roundsText.text = `${this.numberOfRounds}`;
    this.roundsText.anchor.set(0.5);
    this.container.addChild(this.roundsText);

    // Decrease button
    const decreaseBtn = this.createButton('-', 60, 60);
    decreaseBtn.eventMode = 'static';
    decreaseBtn.cursor = 'pointer';
    decreaseBtn.on('pointerdown', () => this.changeRounds(-1));
    this.container.addChild(decreaseBtn);
    this.adminControls.push(decreaseBtn);

    // Increase button
    const increaseBtn = this.createButton('+', 60, 60);
    increaseBtn.eventMode = 'static';
    increaseBtn.cursor = 'pointer';
    increaseBtn.on('pointerdown', () => this.changeRounds(1));
    this.container.addChild(increaseBtn);
    this.adminControls.push(increaseBtn);

    // Max rounds info
    this.maxRoundsText = new Text({
      text: `(Max: ${this.maxRounds})`,
      style: { fontSize: 18, fill: 0xaaaaaa }
    });
    this.maxRoundsText.anchor.set(0.5);
    this.container.addChild(this.maxRoundsText);
    this.adminControls.push(this.maxRoundsText);

    // Start button
    const startBtn = this.createButton('Start Game', 300, 60);
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.on('pointerdown', () => this.onStartGame());
    this.container.addChild(startBtn);
    this.adminControls.push(startBtn);

    // Close room button for admin
    const closeBtn = this.createButton('Close Room', 300, 60);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.onCloseRoom());
    this.container.addChild(closeBtn);
    this.adminControls.push(closeBtn);
  }

  private createButton(text: string, width: number, height: number): Container {
    const btn = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 10);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 2, color: 0xffffff });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;
    btn.addChild(label);

    return btn;
  }

  private changeRounds(delta: number): void {
    this.numberOfRounds = Math.max(1, Math.min(this.numberOfRounds + delta, this.maxRounds));
    this.roundsText.text = `${this.numberOfRounds}`;
    this.onRoundsChange(this.numberOfRounds);
  }

  private createCopyButton(roomId: string): Container {
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

  updateSettings(rounds: number, maxPlayers: number, playerCount: number): void {
    this.numberOfRounds = rounds;
    this.maxPlayers = maxPlayers;
    this.maxRounds = Math.floor(51 / playerCount);
    this.roundsText.text = `${this.numberOfRounds}`;
    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
    if (this.maxRoundsText) {
      this.maxRoundsText.text = `(Max: ${this.maxRounds})`;
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
