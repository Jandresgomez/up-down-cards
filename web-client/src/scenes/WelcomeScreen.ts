import { Container, Graphics, Text } from 'pixi.js';
import { Input } from '@pixi/ui';

export class WelcomeScreen {
  private container: Container;
  private onJoinRoom: (roomNumber: string) => void;
  private onCreateRoom: () => void;
  private roomInput: Input;
  private errorText: Text;

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
  }

  private createTextInput(): Input {
    const input = new Input({
      bg: new Graphics().roundRect(0, 0, 300, 50, 10).fill(0xffffff).stroke({ width: 2, color: 0x2a9d8f }),
      textStyle: {
        fontSize: 24,
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
    // Title
    const title = new Text({
      text: 'Up Down Cards',
      style: { fontSize: 48, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.x = window.innerWidth / 2;
    title.y = 150;
    this.container.addChild(title);

    // Create Room Button
    const createBtn = this.createButton('Create New Room', window.innerWidth / 2 - 150, 300);
    createBtn.eventMode = 'static';
    createBtn.cursor = 'pointer';
    createBtn.on('pointerdown', () => this.onCreateRoom());
    this.container.addChild(createBtn);

    // Join Room Text
    const joinText = new Text({
      text: 'Or enter room number:',
      style: { fontSize: 24, fill: 0xffffff }
    });
    joinText.anchor.set(0.5);
    joinText.x = window.innerWidth / 2;
    joinText.y = 450;
    this.container.addChild(joinText);

    // Room Input
    this.roomInput.x = window.innerWidth / 2 - 150;
    this.roomInput.y = 500;
    this.container.addChild(this.roomInput);

    // Error text
    this.errorText.anchor.set(0.5);
    this.errorText.x = window.innerWidth / 2;
    this.errorText.y = 570;
    this.container.addChild(this.errorText);

    // Join Button
    const joinBtn = this.createButton('Join Room', window.innerWidth / 2 - 150, 600);
    joinBtn.eventMode = 'static';
    joinBtn.cursor = 'pointer';
    joinBtn.on('pointerdown', () => this.handleJoinRoom());
    this.container.addChild(joinBtn);
  }

  private createButton(text: string, x: number, y: number): Container {
    const btn = new Container();
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 300, 60, 10);
    bg.fill(0x2a9d8f);
    bg.stroke({ width: 2, color: 0xffffff });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    label.anchor.set(0.5);
    label.x = 150;
    label.y = 30;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;

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
