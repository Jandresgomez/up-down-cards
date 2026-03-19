import { Container, Text, Graphics, Rectangle } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { MOCK_SCENARIOS } from '../utils/mockData';
import { BG_SCENE, BG_ROW, TEAL, BTN_PLAYING, SUCCESS, GOLD, TEXT_PRIMARY, TEXT_SECONDARY, MUTED } from '../utils/colors';
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
  { label: 'Round End', shortLabel: 'REnd', phase: 'round_complete', color: SUCCESS },
  { label: 'Game End', shortLabel: 'GEnd', phase: 'game_complete', color: GOLD },
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
    const { width: sw, height: sh, isMobile } = sizes;

    // ── Background ──
    const bg = new Graphics();
    bg.rect(0, 0, sw, sh);
    bg.fill(BG_SCENE);
    this.container.addChild(bg);

    // ── Title + subtitle ──
    const title = new Text({
      text: 'Mock Scenarios',
      style: { fontSize: sizes.subtitleSize, fill: TEXT_PRIMARY, fontWeight: 'bold' },
    });
    title.anchor.set(0.5, 0);
    title.x = sw / 2;
    title.y = isMobile ? 24 : 32;
    this.container.addChild(title);

    const sub = new Text({
      text: 'Pick a scenario and phase',
      style: { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY },
    });
    sub.anchor.set(0.5, 0);
    sub.x = sw / 2;
    sub.y = title.y + title.height + (isMobile ? 6 : 10);
    this.container.addChild(sub);

    // ── Layout constants ──
    const margin = isMobile ? 10 : 16;
    const colGap = isMobile ? 6 : 8;
    const btnH = isMobile ? 36 : 42;
    const rowH = isMobile ? 58 : 66;
    const rowGap = 6;

    const btnCount = PHASES.length;
    const labelW = isMobile ? sw * 0.28 : sw * 0.22;
    const btnAreaW = sw - margin * 2 - labelW - colGap;
    const maxBtnW = isMobile ? sw * 0.15 : 110;
    const btnW = Math.min(maxBtnW, (btnAreaW - (btnCount - 1) * colGap) / btnCount);
    const contentW = labelW + colGap + btnCount * btnW + (btnCount - 1) * colGap;
    const startX = (sw - contentW) / 2;

    // ── Column headers ──
    const headerY = sub.y + sub.height + (isMobile ? 16 : 24);
    const headerFontSize = isMobile ? 12 : 13;

    const scenarioHeader = new Text({
      text: 'Scenario',
      style: { fontSize: headerFontSize, fill: MUTED },
    });
    scenarioHeader.anchor.set(0.5, 0);
    scenarioHeader.x = startX + labelW / 2;
    scenarioHeader.y = headerY;
    this.container.addChild(scenarioHeader);

    PHASES.forEach((p, i) => {
      const btnX = startX + labelW + colGap + i * (btnW + colGap);
      const t = new Text({
        text: isMobile ? p.shortLabel : p.label,
        style: { fontSize: headerFontSize, fill: MUTED },
      });
      t.anchor.set(0.5, 0);
      t.x = btnX + btnW / 2;
      t.y = headerY;
      this.container.addChild(t);
    });

    // ── Row containers ──
    const scrollTopY = headerY + scenarioHeader.height + (isMobile ? 10 : 14);

    const rowContainers: Container[] = MOCK_SCENARIOS.map((scenario) => {
      const rc = new Container();
      rc.boundsArea = new Rectangle(0, 0, sw, rowH);

      // Row background
      const rowBg = new Graphics();
      rowBg.roundRect(startX - 4, 2, contentW + 8, rowH - 4, 8);
      rowBg.fill(BG_ROW);
      rc.addChild(rowBg);

      // Scenario label
      const label = new Text({
        text: scenario.label,
        style: { fontSize: isMobile ? 14 : 15, fill: TEXT_PRIMARY },
      });
      label.anchor.set(0, 0.5);
      label.x = startX + 6;
      label.y = rowH / 2;
      rc.addChild(label);

      // Phase buttons
      PHASES.forEach((phase, i) => {
        const btnX = startX + labelW + colGap + i * (btnW + colGap);
        const btn = this.makeButton(
          isMobile ? phase.shortLabel : phase.label,
          btnW, btnH, phase.color, isMobile,
        );
        btn.x = btnX;
        btn.y = rowH / 2 - btnH / 2;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
          window.location.href = `/mock?phase=${phase.phase}&scenario=${scenario.id}`;
        });
        rc.addChild(btn);
      });

      return rc;
    });

    // ── ScrollBox ──
    const totalContentH = MOCK_SCENARIOS.length * rowH + (MOCK_SCENARIOS.length - 1) * rowGap;
    const availableH = sh - scrollTopY;
    const scrollH = Math.min(availableH, totalContentH);

    const scrollBox = new ScrollBox({
      width: sw,
      height: scrollH,
      type: 'vertical',
      globalScroll: totalContentH > availableH,
      disableDynamicRendering: true,
      elementsMargin: rowGap,
      items: rowContainers,
    });
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
      style: { fontSize: compact ? 12 : 14, fill: TEXT_PRIMARY, fontWeight: 'bold' },
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
