import { Container, Graphics, Text } from 'pixi.js';
import { Input } from '@pixi/ui';
import { getResponsiveSizes } from '../utils/responsive';
import { getPlayerName, setPlayerName, clearPlayerProfile } from '../utils/playerId';
import { TEAL, TEAL_CSS, TEXT_PRIMARY, TEXT_LIGHT, TEXT_DARK, ERROR_LIGHT, BG_ICON_BTN } from '../utils/colors';

type Stage = 'profile' | 'lobby';

export class WelcomeScreen {
  private container: Container;
  private onJoinRoom: (roomNumber: string) => void;
  private onCreateRoom: () => void;
  private stage: Stage;

  // Shared
  private title!: Text;
  private errorText!: Text;

  // Profile stage elements
  private profileContainer!: Container;
  private nameInput!: Input;
  private startBtn!: Container;

  // Lobby stage elements
  private lobbyContainer!: Container;
  private playerNameDisplay!: Text;
  private editBtn!: Container;
  private createBtn!: Container;
  private joinText!: Text;
  private roomInput!: Input;
  private pasteBtnVisual!: Container;
  private pasteDomBtn!: HTMLButtonElement;
  private joinBtn!: Container;

  private prefillRoomId: string | null = null;
  private nameInputPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(onJoinRoom: (roomNumber: string) => void, onCreateRoom: () => void, prefillRoomId?: string) {
    this.container = new Container();
    this.onJoinRoom = onJoinRoom;
    this.onCreateRoom = onCreateRoom;
    this.prefillRoomId = prefillRoomId ?? null;

    this.stage = getPlayerName() ? 'lobby' : 'profile';

    this.buildUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /* ───── Build / Rebuild ───── */

  private buildUI(): void {
    this.container.removeChildren();
    this.removePasteDomBtn();

    const sizes = getResponsiveSizes();

    this.title = new Text({
      text: 'Up Down Cards',
      style: { fontSize: sizes.titleSize, fill: TEXT_PRIMARY, fontWeight: 'bold' }
    });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    this.errorText = new Text({ text: '', style: { fontSize: 18, fill: ERROR_LIGHT } });
    this.errorText.anchor.set(0.5);

    if (this.stage === 'profile') {
      this.buildProfileStage(sizes);
    } else {
      this.buildLobbyStage(sizes);
      if (this.prefillRoomId) {
        this.roomInput.value = this.prefillRoomId;
      }
    }
  }

  /* ───── Profile Stage ───── */

  private buildProfileStage(sizes: ReturnType<typeof getResponsiveSizes>): void {
    this.profileContainer = new Container();

    const prompt = new Text({
      text: "What's your name? (max 12)",
      style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY }
    });
    prompt.anchor.set(0.5);
    this.profileContainer.addChild(prompt);

    this.nameInput = this.createInput(sizes, 'Your name...', 12);
    this.profileContainer.addChild(this.nameInput);

    this.startBtn = this.createButton('Start', sizes.buttonLarge.width, sizes.buttonLarge.height);
    this.startBtn.eventMode = 'static';
    this.startBtn.cursor = 'pointer';
    this.startBtn.on('pointerdown', () => this.handleProfileSubmit());
    this.profileContainer.addChild(this.startBtn);

    this.profileContainer.addChild(this.errorText);

    this.container.addChild(this.profileContainer);
  }

  private handleProfileSubmit(): void {
    const name = this.nameInput.value.trim();
    if (!name) {
      this.showError('Please enter your name');
      return;
    }
    if (name.length > 12) {
      this.showError('Name must be 12 characters or less');
      return;
    }
    setPlayerName(name);
    this.clearError();
    if (this.nameInputPollTimer) clearInterval(this.nameInputPollTimer);
    this.stage = 'lobby';
    this.buildUI();
    this.resize();
  }

  /* ───── Lobby Stage ───── */

  private buildLobbyStage(sizes: ReturnType<typeof getResponsiveSizes>): void {
    this.lobbyContainer = new Container();

    const playerName = getPlayerName() || '';
    this.playerNameDisplay = new Text({
      text: playerName,
      style: { fontSize: sizes.smallFontSize, fill: TEXT_LIGHT }
    });
    this.playerNameDisplay.anchor.set(1, 0);
    this.lobbyContainer.addChild(this.playerNameDisplay);

    this.editBtn = this.createSmallIconButton('✏️');
    this.editBtn.eventMode = 'static';
    this.editBtn.cursor = 'pointer';
    this.editBtn.on('pointerdown', () => {
      clearPlayerProfile();
      if (this.nameInputPollTimer) clearInterval(this.nameInputPollTimer);
      this.stage = 'profile';
      this.buildUI();
      this.resize();
    });
    this.lobbyContainer.addChild(this.editBtn);

    this.createBtn = this.createButton('Create New Room', sizes.buttonLarge.width, sizes.buttonLarge.height);
    this.createBtn.eventMode = 'static';
    this.createBtn.cursor = 'pointer';
    this.createBtn.on('pointerdown', () => this.onCreateRoom());
    this.lobbyContainer.addChild(this.createBtn);

    this.joinText = new Text({
      text: 'Or enter room number:',
      style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY }
    });
    this.joinText.anchor.set(0.5);
    this.lobbyContainer.addChild(this.joinText);

    this.roomInput = this.createInput(sizes, 'Enter room ID...', 10);
    this.lobbyContainer.addChild(this.roomInput);
    this.pasteBtnVisual = this.createPasteVisual();
    this.lobbyContainer.addChild(this.pasteBtnVisual);
    this.pasteDomBtn = this.createPasteDomButton();

    this.lobbyContainer.addChild(this.errorText);

    this.joinBtn = this.createButton('Join Room', sizes.buttonLarge.width, sizes.buttonLarge.height);
    this.joinBtn.eventMode = 'static';
    this.joinBtn.cursor = 'pointer';
    this.joinBtn.on('pointerdown', () => this.handleJoinRoom());
    this.lobbyContainer.addChild(this.joinBtn);

    this.container.addChild(this.lobbyContainer);
  }

  private createSmallIconButton(icon: string): Container {
    const btn = new Container();
    const size = 30;
    const bg = new Graphics();
    bg.roundRect(0, 0, size, size, 6);
    bg.fill(BG_ICON_BTN);
    btn.addChild(bg);
    const label = new Text({
      text: icon,
      style: { fontSize: 16, fill: TEXT_PRIMARY }
    });
    label.anchor.set(0.5);
    label.x = size / 2;
    label.y = size / 2;
    btn.addChild(label);
    return btn;
  }

  /* ───── Shared helpers ───── */

  private createInput(sizes: ReturnType<typeof getResponsiveSizes>, placeholder: string, maxLen?: number, width?: number): Input {
    const inputWidth = width ?? sizes.inputWidth;
    return new Input({
      bg: new Graphics()
        .roundRect(0, 0, inputWidth, sizes.inputHeight, 10)
        .fill(TEXT_PRIMARY)
        .stroke({ width: 2, color: TEAL }),
      textStyle: { fontSize: sizes.fontSize, fill: TEXT_DARK },
      placeholder,
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
      ...(maxLen ? { maxLength: maxLen } : {})
    });
  }

  private createPasteVisual(): Container {
    const sizes = getResponsiveSizes();
    const btnSize = sizes.inputHeight;
    const vis = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnSize, btnSize, 6);
    bg.fill(TEAL);
    vis.addChild(bg);
    const icon = new Graphics();
    const s = btnSize;
    icon.roundRect(s * 0.25, s * 0.3, s * 0.5, s * 0.5, 2);
    icon.stroke({ width: 2, color: TEXT_PRIMARY });
    icon.roundRect(s * 0.35, s * 0.2, s * 0.3, s * 0.15, 2);
    icon.stroke({ width: 2, color: TEXT_PRIMARY });
    vis.addChild(icon);
    vis.eventMode = 'none';
    return vis;
  }

  private createPasteDomButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:60%;height:60%"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;
    btn.style.cssText = `
      position: fixed; border: 2px solid white; background: ${TEAL_CSS}; border-radius: 6px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      padding: 0; z-index: 1000; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent; box-sizing: border-box;
    `;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handlePaste();
    });
    document.body.appendChild(btn);
    return btn;
  }

  private removePasteDomBtn(): void {
    if (this.pasteDomBtn) {
      this.pasteDomBtn.remove();
    }
  }

  private async handlePaste(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { this.roomInput.value = text.trim(); return; }
    } catch { /* fall through */ }
    const text = window.prompt('Paste your room ID:');
    if (text) { this.roomInput.value = text.trim(); }
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

  private handleJoinRoom(): void {
    const roomNumber = this.roomInput.value.trim();
    if (!roomNumber) {
      this.showError('Provided room ID is not valid');
      return;
    }
    this.clearError();
    this.onJoinRoom(roomNumber);
  }

  showError(message: string): void {
    this.errorText.text = message;
  }

  clearError(): void {
    this.errorText.text = '';
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    if (this.nameInputPollTimer) clearInterval(this.nameInputPollTimer);
    this.removePasteDomBtn();
    this.container.destroy({ children: true });
  }

  /* ───── Resize ───── */

  private resize(): void {
    const sizes = getResponsiveSizes();
    const centerX = sizes.width / 2;
    let currentY = sizes.height * 0.15;

    this.title.style.fontSize = sizes.titleSize;
    this.title.x = centerX;
    this.title.y = currentY;
    currentY += this.title.height + sizes.spacing;

    if (this.stage === 'profile') {
      this.resizeProfile(sizes, centerX, currentY);
    } else {
      this.resizeLobby(sizes, centerX, currentY);
    }
  }

  private resizeProfile(sizes: ReturnType<typeof getResponsiveSizes>, centerX: number, startY: number): void {
    let currentY = startY;
    const children = this.profileContainer.children;

    // prompt text (child 0)
    const prompt = children[0] as Text;
    prompt.style.fontSize = sizes.fontSize;
    prompt.x = centerX;
    prompt.y = currentY;
    currentY += prompt.height + sizes.spacing * 0.5;

    // name input (child 1) — recreate for sizing
    const oldName = this.nameInput.value;
    this.profileContainer.removeChild(this.nameInput);
    this.nameInput = this.createInput(sizes, 'Your name...', 12);
    this.nameInput.value = oldName;
    this.profileContainer.addChildAt(this.nameInput, 1);
    this.nameInput.x = centerX - sizes.inputWidth / 2;
    this.nameInput.y = currentY;
    currentY += sizes.inputHeight + sizes.spacing;

    // start button (child 2)
    this.startBtn.x = centerX - sizes.buttonLarge.width / 2;
    this.startBtn.y = currentY;
    this.updateButtonSize(this.startBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
    currentY += sizes.buttonLarge.height + sizes.spacing * 0.5;

    // error text (child 3)
    this.errorText.x = centerX;
    this.errorText.y = currentY;
  }

  private resizeLobby(sizes: ReturnType<typeof getResponsiveSizes>, centerX: number, startY: number): void {
    let currentY = startY;

    // Player name display — top right
    this.playerNameDisplay.style.fontSize = sizes.smallFontSize;
    this.playerNameDisplay.x = sizes.width - 50;
    this.playerNameDisplay.y = 12;

    // Edit button next to name
    this.editBtn.x = sizes.width - 42;
    this.editBtn.y = 10;

    // Create button
    this.createBtn.x = centerX - sizes.buttonLarge.width / 2;
    this.createBtn.y = currentY;
    this.updateButtonSize(this.createBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
    currentY += sizes.buttonLarge.height + sizes.spacing * 4;

    // Join text
    this.joinText.style.fontSize = sizes.fontSize;
    this.joinText.x = centerX;
    this.joinText.y = currentY;
    currentY += this.joinText.height + sizes.spacing * 0.5;

    // Room input — narrower to leave room for paste button
    const pasteBtnSize = sizes.inputHeight;
    const inputOnlyWidth = sizes.inputWidth - pasteBtnSize - sizes.padding;
    const oldValue = this.roomInput.value;
    const roomIdx = this.lobbyContainer.getChildIndex(this.roomInput);
    this.lobbyContainer.removeChild(this.roomInput);
    this.roomInput = this.createInput(sizes, 'Enter room ID...', 10, inputOnlyWidth);
    this.roomInput.value = oldValue;
    this.lobbyContainer.addChildAt(this.roomInput, roomIdx);
    this.roomInput.x = centerX - sizes.inputWidth / 2;
    this.roomInput.y = currentY;

    // Paste visual — outside input, to the right
    const pasteIdx = this.lobbyContainer.getChildIndex(this.pasteBtnVisual);
    this.lobbyContainer.removeChild(this.pasteBtnVisual);
    this.pasteBtnVisual = this.createPasteVisual();
    this.lobbyContainer.addChildAt(this.pasteBtnVisual, pasteIdx);
    this.pasteBtnVisual.x = centerX - sizes.inputWidth / 2 + inputOnlyWidth + sizes.padding;
    this.pasteBtnVisual.y = currentY;

    // Sync DOM paste button
    this.pasteDomBtn.style.left = `${this.pasteBtnVisual.x}px`;
    this.pasteDomBtn.style.top = `${this.pasteBtnVisual.y}px`;
    this.pasteDomBtn.style.width = `${pasteBtnSize}px`;
    this.pasteDomBtn.style.height = `${pasteBtnSize}px`;

    currentY += sizes.inputHeight + sizes.spacing * 0.8;

    // Error text
    this.errorText.x = centerX;
    this.errorText.y = currentY;
    currentY += Math.max(this.errorText.height, 20) + sizes.spacing * 0.5;

    // Join button
    this.joinBtn.x = centerX - sizes.buttonLarge.width / 2;
    this.joinBtn.y = currentY;
    this.updateButtonSize(this.joinBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
  }
}
