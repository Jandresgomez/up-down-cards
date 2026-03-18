import { Container, Text, Graphics } from 'pixi.js';
import { MOCK_SCENARIOS } from '../utils/mockData';
import { BG_SCENE, BG_ROW, TEAL, BTN_PLAYING, TEXT_PRIMARY, TEXT_SECONDARY, MUTED } from '../utils/colors';
import { vw } from '../utils/responsive';

export class MockPickerScreen {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.build();
    window.addEventListener('resize', () => this.build());
  }

  private build(): void {
    this.container.removeChildren();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;

    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill(BG_SCENE);
    this.container.addChild(bg);

    const title = new Text({
      text: 'Mock Scenario Picker',
      style: { fontSize: 32, fill: TEXT_PRIMARY, fontWeight: 'bold' },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = h * 0.1;
    this.container.addChild(title);

    const sub = new Text({
      text: 'Choose a scenario and phase to preview',
      style: { fontSize: 16, fill: TEXT_SECONDARY },
    });
    sub.anchor.set(0.5);
    sub.x = cx;
    sub.y = h * 0.1 + 48;
    this.container.addChild(sub);

    const rowH = 72;
    const btnW = vw(20);
    const btnH = 42;
    const labelW = vw(40);
    const colGap = vw(2);
    const totalW = labelW + colGap + btnW + colGap + btnW;
    const startX = cx - totalW / 2;
    const startY = h * 0.25;

    // Column headers
    const makeHeader = (text: string, x: number, y: number) => {
      const t = new Text({ text, style: { fontSize: 13, fill: MUTED } });
      t.anchor.set(0.5, 1);
      t.x = x;
      t.y = y;
      this.container.addChild(t);
    };
    makeHeader('Scenario', startX + labelW / 2, startY - 10);
    makeHeader('Betting', startX + labelW + colGap + btnW / 2, startY - 10);
    makeHeader('Playing', startX + labelW + colGap * 2 + btnW + btnW / 2, startY - 10);

    MOCK_SCENARIOS.forEach((scenario, idx) => {
      const rowY = startY + idx * rowH;
      const rowCentreY = rowY + (rowH - 10) / 2;

      const rowBg = new Graphics();
      rowBg.roundRect(startX - 12, rowY, totalW + 24, rowH - 8, 10);
      rowBg.fill(BG_ROW);
      this.container.addChild(rowBg);

      const label = new Text({
        text: scenario.label,
        style: { fontSize: 15, fill: TEXT_PRIMARY },
      });
      label.anchor.set(0, 0.5);
      label.x = startX;
      label.y = rowCentreY;
      this.container.addChild(label);

      const bettingBtn = this.makeButton('Betting', btnW, btnH, TEAL);
      bettingBtn.x = startX + labelW + colGap;
      bettingBtn.y = rowCentreY - btnH / 2;
      bettingBtn.eventMode = 'static';
      bettingBtn.cursor = 'pointer';
      bettingBtn.on('pointerdown', () => {
        window.location.href = `/mock?phase=betting&scenario=${scenario.id}`;
      });
      this.container.addChild(bettingBtn);

      const playingBtn = this.makeButton('Playing', btnW, btnH, BTN_PLAYING);
      playingBtn.x = startX + labelW + colGap * 2 + btnW;
      playingBtn.y = rowCentreY - btnH / 2;
      playingBtn.eventMode = 'static';
      playingBtn.cursor = 'pointer';
      playingBtn.on('pointerdown', () => {
        window.location.href = `/mock?phase=playing&scenario=${scenario.id}`;
      });
      this.container.addChild(playingBtn);
    });
  }

  private makeButton(text: string, w: number, h: number, color: number): Container {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill(color);
    btn.addChild(bg);
    const label = new Text({
      text,
      style: { fontSize: 15, fill: TEXT_PRIMARY, fontWeight: 'bold' },
    });
    label.anchor.set(0.5);
    label.x = w / 2;
    label.y = h / 2;
    btn.addChild(label);
    return btn;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
