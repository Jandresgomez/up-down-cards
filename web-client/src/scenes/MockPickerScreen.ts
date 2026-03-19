import { Container, Text, Graphics } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { MOCK_SCENARIOS } from '../utils/mockData';
import { BG_SCENE, BG_ROW, TEAL, BTN_PLAYING, SUCCESS, TEXT_PRIMARY, TEXT_SECONDARY, MUTED } from '../utils/colors';
import { getResponsiveSizes } from '../utils/responsive';

interface PhaseButton {
  label: string;
  shortLabel: string;
  phase: string;
  color: number;
}

const PHASES: PhaseButton[] = [
  { label: 'Betting', shortLabel: 'Bet', phase: 'betting', color: TEAL },
  { label: 'Playing', shortLabel: 'Play', phase: 'playing', color: BTN_PLAYING },
  { label: 'Round End', shortLabel: 'End', phase: 'round_complete', color: SUCCESS },
];

export class MockPickerScreen {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.build();
    window.addEventListener('resize', () => this.build());
  }

  private build(): void {
    this.container.removeChildren();

    const sizes = getResponsiveSizes();
    const { width: w, height: h, isMobile } = sizes;
    const cx = w / 2;

    // Full-screen bg
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill(BG_SCENE);
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: 'Mock Scenarios',
      style: { fontSize: sizes.subtitleSize, fill: TEXT_PRIMARY, fontWeight: 'bold' },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = isMobile ? 40 : h * 0.08;
    this.container.addChild(title);

    const sub = new Text({
      text: 'Pick a scenario and phase',
      style: { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY },
    });
    sub.anchor.set(0.5);
    sub.x = cx;
    sub.y = title.y + (isMobile ? 28 : 36);
    this.container.addChild(sub);

    // Layout
    const margin = isMobile ? 8 : 16;
    const colGap = isMobile ? 6 : 8;
    const btnH = isMobile ? 38 : 42;
    const rowH = isMobile ? 64 : 72;
    const usableW = w - margin * 2;

    // Button widths: on mobile use compact sizing
    const btnCount = PHASES.length;
    const btnTotalGaps = (btnCount - 1) * colGap;
    const labelW = isMobile ? usableW * 0.34 : usableW * 0.36;
    const btnAreaW = usableW - labelW - colGap;
    const maxBtnW = isMobile ? w * 0.16 : 120;
    const btnW = Math.min(maxBtnW, (btnAreaW - btnTotalGaps) / btnCount);

    // Actual content width based on label + buttons
    const actualContentW = labelW + colGap + btnCount * btnW + btnTotalGaps;
    const startX = (w - actualContentW) / 2;
    const headerY = sub.y + (isMobile ? 28 : 44);

    // Scrollable content via ScrollBox
    const contentStartY = headerY;
    const visibleH = h - contentStartY;

    // Column headers in a separate container above the scroll
    const headerContainer = new Container();
    headerContainer.y = contentStartY;

    const headerFontSize = isMobile ? 13 : 13;
    const makeHeader = (text: string, x: number) => {
      const t = new Text({ text, style: { fontSize: headerFontSize, fill: MUTED } });
      t.anchor.set(0.5, 0);
      t.x = x;
      t.y = 0;
      headerContainer.addChild(t);
    };

    makeHeader('Scenario', startX + labelW / 2);
    PHASES.forEach((p, i) => {
      const btnX = startX + labelW + colGap + i * (btnW + colGap);
      makeHeader(isMobile ? p.shortLabel : p.label, btnX + btnW / 2);
    });
    this.container.addChild(headerContainer);

    const rowStartY = isMobile ? 20 : 28;
    const scrollTopY = contentStartY + rowStartY;
    const scrollVisibleH = h - scrollTopY;

    // Build each scenario row as a Container
    const rowContainers: Container[] = MOCK_SCENARIOS.map((scenario, idx) => {
      const rowContainer = new Container();

      const rowBg = new Graphics();
      rowBg.roundRect(startX - 4, 0, actualContentW + 8, rowH - 6, 8);
      rowBg.fill(BG_ROW);
      rowContainer.addChild(rowBg);

      const labelFontSize = isMobile ? 15 : 15;
      const label = new Text({
        text: scenario.label,
        style: { fontSize: labelFontSize, fill: TEXT_PRIMARY },
      });
      label.anchor.set(0, 0.5);
      label.x = startX + 4;
      label.y = (rowH - 6) / 2;
      rowContainer.addChild(label);

      PHASES.forEach((phase, i) => {
        const btnX = startX + labelW + colGap + i * (btnW + colGap);
        const btnLabel = isMobile ? phase.shortLabel : phase.label;
        const btn = this.makeButton(btnLabel, btnW, btnH, phase.color, isMobile);
        btn.x = btnX;
        btn.y = (rowH - 6) / 2 - btnH / 2;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
          window.location.href = `/mock?phase=${phase.phase}&scenario=${scenario.id}`;
        });
        rowContainer.addChild(btn);
      });

      return rowContainer;
    });

    const scrollBox = new ScrollBox({
      width: w,
      height: scrollVisibleH,
      type: 'vertical',
      globalScroll: true,
      disableDynamicRendering: true,
      elementsMargin: 6,
    });
    scrollBox.addItems(rowContainers);
    scrollBox.x = 0;
    scrollBox.y = scrollTopY;
    this.container.addChild(scrollBox);
  }

  private makeButton(text: string, w: number, h: number, color: number, compact: boolean): Container {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 6);
    bg.fill(color);
    btn.addChild(bg);
    const label = new Text({
      text,
      style: { fontSize: compact ? 13 : 14, fill: TEXT_PRIMARY, fontWeight: 'bold' },
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
