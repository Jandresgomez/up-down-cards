import { Container, Graphics, Text } from 'pixi.js';
import { Input } from '@pixi/ui';
import { getResponsiveSizes } from '../utils/responsive';

export class WelcomeScreen {
  private container: Container;
  private onJoinRoom: (roomNumber: string) => void;
  private onCreateRoom: () => void;
  private roomInput: Input;
  private errorText: Text;
  private title: Text;
  private createBtn: Container;
  private joinText: Text;
  private joinBtn: Container;

  constructor(onJoinRoom: (roomNumber: string) => void, onCreateRoom: () => void) {
    this.container = new Container();
    this.onJoinRoom = onJoinRoom;
    this.onCreateRoom = onCreateRoom;

    // Initialize error text
    this.errorText = new Text({
      text: '',
      style: { fontSize: 18, fill: 0xff4444 }
    });

    // Create text input
    this.roomInput = this.createTextInput();

    this.createUI();
    this.resize();

    // Listen for window resize
    window.addEventListener('resize', () => this.resize());
  }

  private createTextInput(): Input {
    const sizes = getResponsiveSizes();

    const input = new Input({
      bg: new Graphics()
        .roundRect(0, 0, sizes.inputWidth, sizes.inputHeight, 10)
        .fill(0xffffff)
        .stroke({ width: 2, color: 0x2a9d8f }),
      textStyle: {
        fontSize: sizes.fontSize,
        fill: 0x000000
      },
      placeholder: 'Enter room ID...',
      padding: {
        top: 12,
        right: 12,
        bottom: 12,
        left: 12
      }
    });

    return input;
  }

  private createUI(): void {
    const sizes = getResponsiveSizes();

    // Title
    this.title = new Text({
      text: 'Up Down Cards',
      style: { fontSize: sizes.titleSize, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    // Create Room Button
    this.createBtn = this.createButton('Create New Room', sizes.buttonLarge.width, sizes.buttonLarge.height);
    this.createBtn.eventMode = 'static';
    this.createBtn.cursor = 'pointer';
    this.createBtn.on('pointerdown', () => this.onCreateRoom());
    this.container.addChild(this.createBtn);

    // Join Room Text
    this.joinText = new Text({
      text: 'Or enter room number:',
      style: { fontSize: sizes.fontSize, fill: 0xffffff }
    });
    this.joinText.anchor.set(0.5);
    this.container.addChild(this.joinText);

    // Room Input
    this.container.addChild(this.roomInput);

    // Error text
    this.errorText.anchor.set(0.5);
    this.container.addChild(this.errorText);

    // Join Button
    this.joinBtn = this.createButton('Join Room', sizes.buttonLarge.width, sizes.buttonLarge.height);
    this.joinBtn.eventMode = 'static';
    this.joinBtn.cursor = 'pointer';
    this.joinBtn.on('pointerdown', () => this.handleJoinRoom());
    this.container.addChild(this.joinBtn);
  }

  private resize(): void {
    const sizes = getResponsiveSizes();
    const centerX = sizes.width / 2;
    let currentY = sizes.height * 0.2;

    // Update title
    this.title.style.fontSize = sizes.titleSize;
    this.title.x = centerX;
    this.title.y = currentY;
    currentY += this.title.height + sizes.spacing;

    // Update create button
    this.createBtn.x = centerX - sizes.buttonLarge.width / 2;
    this.createBtn.y = currentY;
    this.updateButtonSize(this.createBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
    currentY += sizes.buttonLarge.height + sizes.spacing;

    // Update join text
    this.joinText.style.fontSize = sizes.fontSize;
    this.joinText.x = centerX;
    this.joinText.y = currentY;
    currentY += this.joinText.height + sizes.spacing * 0.5;

    // Recreate input with new size
    const oldValue = this.roomInput.value;
    this.container.removeChild(this.roomInput);
    this.roomInput = this.createTextInput();
    this.roomInput.value = oldValue;
    this.container.addChildAt(this.roomInput, this.container.getChildIndex(this.errorText));
    this.roomInput.x = centerX - sizes.inputWidth / 2;
    this.roomInput.y = currentY;
    currentY += sizes.inputHeight + sizes.spacing * 0.8;

    // Update error text
    this.errorText.x = centerX;
    this.errorText.y = currentY;
    currentY += Math.max(this.errorText.height, 20) + sizes.spacing * 0.5;

    // Update join button
    this.joinBtn.x = centerX - sizes.buttonLarge.width / 2;
    this.joinBtn.y = currentY;
    this.updateButtonSize(this.joinBtn, sizes.buttonLarge.width, sizes.buttonLarge.height, sizes.fontSize);
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
    this.container.destroy({ children: true });
  }
}
