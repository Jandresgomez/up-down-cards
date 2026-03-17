import { Container, Graphics, Text } from 'pixi.js';
import { getResponsiveSizes } from '../utils/responsive';
import { TEAL, TEAL_CSS, SUCCESS_CSS, TEXT_PRIMARY, TEXT_SECONDARY } from '../utils/colors';

const CLIPBOARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:60%;height:60%"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;
const SHARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:60%;height:60%"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;

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
  private copyBtnVisual!: Container;
  private shareBtnVisual!: Container;
  private copyDomBtn!: HTMLButtonElement;
  private shareDomBtn!: HTMLButtonElement;
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
      style: { fontSize: 32, fill: TEXT_PRIMARY, fontWeight: 'bold' }
    });

    this.playersText = new Text({
      text: '',
      style: { fontSize: 24, fill: TEXT_PRIMARY }
    });

    this.title = new Text({
      text: 'Waiting Room',
      style: { fontSize: 48, fill: TEXT_PRIMARY, fontWeight: 'bold' }
    });

    this.roomText = new Text({
      text: `Room: ${roomId}`,
      style: { fontSize: 28, fill: TEXT_SECONDARY }
    });

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
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    this.roomText.anchor.set(0.5);
    this.container.addChild(this.roomText);

    const sizes = this.getScreenResponsiveSizes();
    this.copyBtnVisual = this.createIconVisual(sizes.inputHeight);
    this.shareBtnVisual = this.createIconVisual(sizes.inputHeight);
    this.container.addChild(this.copyBtnVisual);
    this.container.addChild(this.shareBtnVisual);

    this.copyDomBtn = this.createDomButton(CLIPBOARD_SVG, () => this.handleCopy());
    this.shareDomBtn = this.createDomButton(SHARE_SVG, () => this.handleShare());

    this.playersText.text = `Players: ${this.numberOfPlayers} / ${this.maxPlayers}`;
    this.playersText.anchor.set(0.5);
    this.container.addChild(this.playersText);

    if (this.isAdmin) {
      this.createAdminControls();
    } else {
      this.createNonAdminControls();
    }
  }

  private createIconVisual(btnSize: number): Container {
    const vis = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnSize, btnSize, 6);
    bg.fill(TEAL);
    vis.addChild(bg);
    return vis;
  }

  private updateIconVisual(vis: Container, btnSize: number): void {
    const bg = vis.getChildAt(0) as Graphics;
    bg.clear();
    bg.roundRect(0, 0, btnSize, btnSize, 6);
    bg.fill(TEAL);
  }

  private createDomButton(svg: string, handler: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = svg;
    btn.style.cssText = `
      position: fixed; border: 2px solid white; background: ${TEAL_CSS}; border-radius: 6px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      padding: 0; z-index: 1000; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent; box-sizing: border-box;
    `;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
    document.body.appendChild(btn);
    return btn;
  }

  private async handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.roomId);
      this.copyDomBtn.style.background = SUCCESS_CSS;
      setTimeout(() => { this.copyDomBtn.style.background = TEAL_CSS; }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  private async handleShare(): Promise<void> {
    const url = `${window.location.origin}/join?roomId=${this.roomId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my Up Down Cards game', url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        this.shareDomBtn.style.background = SUCCESS_CSS;
        setTimeout(() => { this.shareDomBtn.style.background = TEAL_CSS; }, 1500);
      } catch { /* ignore */ }
    }
  }

  private createNonAdminControls(): void {
    const waitingText = new Text({
      text: 'Waiting for admin to start the game...',
      style: { fontSize: 24, fill: TEXT_SECONDARY }
    });
    waitingText.anchor.set(0.5);
    this.container.addChild(waitingText);
    this.nonAdminControls.push(waitingText);

    const leaveBtn = this.createButton('Leave Room', 300, 60);
    leaveBtn.eventMode = 'static';
    leaveBtn.cursor = 'pointer';
    leaveBtn.on('pointerdown', () => this.onLeaveRoom());
    this.container.addChild(leaveBtn);
    this.nonAdminControls.push(leaveBtn);
  }

  private adaptiveSpacing(sizes: ReturnType<typeof this.getScreenResponsiveSizes>): number {
    const btnSize = sizes.inputHeight;
    const itemHeights = this.isAdmin
      ? [sizes.titleSize, btnSize, sizes.fontSize, sizes.fontSize, sizes.roundsSize, 16, sizes.buttonLarge.height, sizes.buttonLarge.height]
      : [sizes.titleSize, btnSize, sizes.fontSize, sizes.fontSize, sizes.buttonLarge.height];
    const totalContent = itemHeights.reduce((a, b) => a + b, 0);
    const available = sizes.height * 0.82;
    const spacing = (available - totalContent) / (itemHeights.length - 1);
    return Math.max(sizes.spacing * 0.5, Math.min(sizes.spacing * 3, spacing));
  }

  private resize(): void {
    const sizes = this.getScreenResponsiveSizes();
    const centerX = sizes.width / 2;
    const btnSize = sizes.inputHeight;
    const spacing = this.adaptiveSpacing(sizes);
    let currentY = sizes.height * 0.09;

    // Title
    this.title.style.fontSize = sizes.titleSize;
    this.title.x = centerX;
    this.title.y = currentY;
    currentY += sizes.titleSize + spacing;

    // Room ID + copy + share buttons in a row
    this.roomText.style.fontSize = sizes.subtitleSize;
    const totalRowWidth = this.roomText.width + sizes.spacing + btnSize + sizes.padding + btnSize;
    const rowLeft = centerX - totalRowWidth / 2;

    this.roomText.x = rowLeft + this.roomText.width / 2;
    this.roomText.y = currentY + btnSize / 2;

    this.updateIconVisual(this.copyBtnVisual, btnSize);
    this.copyBtnVisual.x = rowLeft + this.roomText.width + sizes.spacing;
    this.copyBtnVisual.y = currentY;

    this.updateIconVisual(this.shareBtnVisual, btnSize);
    this.shareBtnVisual.x = rowLeft + this.roomText.width + sizes.spacing + btnSize + sizes.padding;
    this.shareBtnVisual.y = currentY;

    // Sync DOM buttons
    this.copyDomBtn.style.left = `${this.copyBtnVisual.x}px`;
    this.copyDomBtn.style.top = `${this.copyBtnVisual.y}px`;
    this.copyDomBtn.style.width = `${btnSize}px`;
    this.copyDomBtn.style.height = `${btnSize}px`;

    this.shareDomBtn.style.left = `${this.shareBtnVisual.x}px`;
    this.shareDomBtn.style.top = `${this.shareBtnVisual.y}px`;
    this.shareDomBtn.style.width = `${btnSize}px`;
    this.shareDomBtn.style.height = `${btnSize}px`;

    currentY += btnSize + spacing;

    // Players count
    this.playersText.style.fontSize = sizes.fontSize;
    this.playersText.x = centerX;
    this.playersText.y = currentY;
    currentY += sizes.fontSize + spacing;

    if (this.isAdmin) {
      this.resizeAdminControls(centerX, currentY, sizes, spacing);
    } else {
      this.resizeNonAdminControls(centerX, currentY, sizes, spacing);
    }
  }

  private resizeAdminControls(centerX: number, currentY: number, sizes: any, spacing: number): void {
    const controls = this.adminControls;

    // Rounds label (index 0)
    const roundsLabel = controls[0] as Text;
    roundsLabel.style.fontSize = sizes.fontSize;
    roundsLabel.x = centerX;
    roundsLabel.y = currentY;
    currentY += sizes.fontSize + spacing * 0.5;

    // Rounds display
    this.roundsText.style.fontSize = sizes.roundsSize;
    this.roundsText.x = centerX;
    this.roundsText.y = currentY;

    // Decrease button (index 1)
    const decreaseBtn = controls[1];
    decreaseBtn.x = centerX - sizes.buttonSmall.width - sizes.spacing * 4;
    decreaseBtn.y = currentY - sizes.buttonSmall.height / 2 + this.roundsText.height / 2;
    this.updateButtonSize(decreaseBtn, sizes.buttonSmall.width, sizes.buttonSmall.height, sizes.fontSize);

    // Increase button (index 2)
    const increaseBtn = controls[2];
    increaseBtn.x = centerX + sizes.spacing * 4;
    increaseBtn.y = currentY - sizes.buttonSmall.height / 2 + this.roundsText.height / 2;
    this.updateButtonSize(increaseBtn, sizes.buttonSmall.width, sizes.buttonSmall.height, sizes.fontSize);
    currentY += sizes.roundsSize + spacing * 0.5;

    // Max rounds info (index 3)
    if (this.maxRoundsText) {
      this.maxRoundsText.style.fontSize = sizes.isMobile ? 14 : 18;
      this.maxRoundsText.x = centerX;
      this.maxRoundsText.y = currentY;
      currentY += (sizes.isMobile ? 14 : 18) + spacing;
    }

    // Start button (index 4)
    const startBtn = controls[4];
    startBtn.x = centerX - sizes.buttonLarge.width / 2;
    startBtn.y = currentY;
    this.updateButtonSize(startBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
    currentY += sizes.buttonLarge.height + spacing * 0.5;

    // Close button (index 5)
    const closeBtn = controls[5];
    closeBtn.x = centerX - sizes.buttonLarge.width / 2;
    closeBtn.y = currentY;
    this.updateButtonSize(closeBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
  }

  private resizeNonAdminControls(centerX: number, currentY: number, sizes: any, spacing: number): void {
    const waitingText = this.nonAdminControls[0] as Text;
    waitingText.style.fontSize = sizes.fontSize;
    waitingText.x = centerX;
    waitingText.y = currentY;
    currentY += sizes.fontSize + spacing;

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
    bg.fill(TEAL);
    bg.stroke({ width: 2, color: TEXT_PRIMARY });

    text.style.fontSize = fontSize;
    text.x = width / 2;
    text.y = height / 2;
  }

  private createAdminControls(): void {
    const roundsLabel = new Text({
      text: 'Number of Rounds:',
      style: { fontSize: 24, fill: TEXT_PRIMARY }
    });
    roundsLabel.anchor.set(0.5);
    this.container.addChild(roundsLabel);
    this.adminControls.push(roundsLabel);

    this.roundsText.text = `${this.numberOfRounds}`;
    this.roundsText.anchor.set(0.5);
    this.container.addChild(this.roundsText);

    const decreaseBtn = this.createButton('-', 60, 60);
    decreaseBtn.eventMode = 'static';
    decreaseBtn.cursor = 'pointer';
    decreaseBtn.on('pointerdown', () => this.changeRounds(-1));
    this.container.addChild(decreaseBtn);
    this.adminControls.push(decreaseBtn);

    const increaseBtn = this.createButton('+', 60, 60);
    increaseBtn.eventMode = 'static';
    increaseBtn.cursor = 'pointer';
    increaseBtn.on('pointerdown', () => this.changeRounds(1));
    this.container.addChild(increaseBtn);
    this.adminControls.push(increaseBtn);

    this.maxRoundsText = new Text({
      text: `(Max: ${this.maxRounds})`,
      style: { fontSize: 18, fill: TEXT_SECONDARY }
    });
    this.maxRoundsText.anchor.set(0.5);
    this.container.addChild(this.maxRoundsText);
    this.adminControls.push(this.maxRoundsText);

    const startBtn = this.createButton('Start Game', 300, 60);
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.on('pointerdown', () => this.onStartGame());
    this.container.addChild(startBtn);
    this.adminControls.push(startBtn);

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
    bg.fill(TEAL);
    bg.stroke({ width: 2, color: TEXT_PRIMARY });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: 24, fill: TEXT_PRIMARY, fontWeight: 'bold' }
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
    this.copyDomBtn?.remove();
    this.shareDomBtn?.remove();
    this.container.destroy({ children: true });
  }
}
