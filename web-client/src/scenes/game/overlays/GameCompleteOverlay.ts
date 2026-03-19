import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes } from '../../../utils/responsive';
import {
  BG_OVERLAY, BG_PANEL, GOLD, RANK_2ND, RANK_3RD,
  TEXT_PRIMARY, TEXT_SECONDARY, ROW_HIGHLIGHT,
} from '../../../utils/colors';
import { ScrollBox } from '@pixi/ui';

function truncName(name: string, maxChars: number): string {
  return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
}

interface StandingRow {
  playerId: string;
  name: string;
  total: number;
}

export class GameCompleteOverlay extends Container {
  constructor(
    gameState: GameState,
    myPlayerId: string,
    playerNames: Record<string, { name: string }> = {},
  ) {
    super();

    const sizes = getResponsiveSizes();
    const { width: sw, height: sh, isMobile } = sizes;
    const pad = sizes.padding;
    const panelPad = isMobile ? 20 : 28;
    const panelW = isMobile ? sw * 0.9 : 540;
    const rowH = isMobile ? 44 : 52;
    const maxVisibleRows = isMobile ? 4 : 5;

    // --- Sorted standings ---
    const rows: StandingRow[] = [...gameState.players]
      .map((p) => {
        const profile = playerNames[p.id];
        const name = profile?.name || `Player ${p.naturalOrder + 1}`;
        return { playerId: p.id, name, total: p.totalScore };
      })
      .sort((a, b) => b.total - a.total);

    // ── Measure pass: build temporary Text objects to get real heights ──
    let contentH = 0;

    // Title
    const titleText = new Text({
      text: '🏆 Game Complete!',
      style: { fontSize: isMobile ? 36 : 52, fill: GOLD, fontWeight: 'bold' },
    });
    contentH += titleText.height + (isMobile ? 16 : 24);

    // Podium lines (measure actual rendered height)
    const podiumData: { medal: string; color: number; fontSize: number }[] = [
      { medal: '🥇', color: GOLD, fontSize: isMobile ? 28 : 40 },
      { medal: '🥈', color: RANK_2ND, fontSize: isMobile ? 22 : 30 },
      { medal: '🥉', color: RANK_3RD, fontSize: isMobile ? 22 : 30 },
    ];
    const podiumCount = Math.min(rows.length, 3);
    const podiumTexts: Text[] = [];
    for (let i = 0; i < podiumCount; i++) {
      const row = rows[i];
      const { medal, color, fontSize } = podiumData[i];
      const displayName = truncName(row.name, isMobile ? 10 : row.name.length);
      const t = new Text({
        text: `${medal}  ${displayName}  —  ${row.total} pts`,
        style: { fontSize, fill: color, fontWeight: i === 0 ? 'bold' : 'normal' },
      });
      podiumTexts.push(t);
      contentH += t.height + (isMobile ? 6 : 8);
    }
    contentH += isMobile ? 16 : 24; // gap after podium

    // Divider
    contentH += 1 + (isMobile ? 16 : 20);

    // "Full Standings" label
    const standingsLabel = new Text({
      text: 'Full Standings',
      style: { fontSize: sizes.smallFontSize, fill: TEXT_SECONDARY, fontWeight: 'bold' },
    });
    contentH += standingsLabel.height + (isMobile ? 8 : 12);

    // Column headers
    contentH += isMobile ? 20 : 24;

    // Table
    const tableH = Math.min(rows.length, maxVisibleRows) * rowH;
    contentH += tableH;

    // Footer
    contentH += isMobile ? 16 : 24;
    const thanksText = new Text({
      text: 'Thanks for playing!',
      style: { fontSize: sizes.smallFontSize, fill: TEXT_SECONDARY },
    });
    contentH += thanksText.height;
    contentH += isMobile ? 20 : 28; // bottom padding after thanks

    // ── Panel dimensions ──
    const panelH = contentH + panelPad * 2;
    const panelX = (sw - panelW) / 2;
    const panelY = (sh - panelH) / 2;
    const cx = panelX + panelW / 2;

    // ── Background overlay ──
    const bg = new Graphics();
    bg.rect(0, 0, sw, sh);
    bg.fill({ color: BG_OVERLAY, alpha: 0.9 });
    this.addChild(bg);

    // ── Panel ──
    const panelBg = new Graphics();
    panelBg.roundRect(panelX, panelY, panelW, panelH, 20);
    panelBg.fill(BG_PANEL);
    panelBg.stroke({ width: 4, color: GOLD });
    this.addChild(panelBg);

    // ── Render pass ──
    let cursor = panelY + panelPad;

    // Title
    titleText.anchor.set(0.5, 0);
    titleText.x = cx;
    titleText.y = cursor;
    this.addChild(titleText);
    cursor += titleText.height + (isMobile ? 16 : 24);

    // Podium
    for (let i = 0; i < podiumCount; i++) {
      const t = podiumTexts[i];
      t.anchor.set(0.5, 0);
      t.x = cx;
      t.y = cursor;
      this.addChild(t);
      cursor += t.height + (isMobile ? 6 : 8);
    }
    cursor += isMobile ? 16 : 24;

    // Divider
    const divider = new Graphics();
    divider.moveTo(panelX + pad * 3, cursor);
    divider.lineTo(panelX + panelW - pad * 3, cursor);
    divider.stroke({ width: 1, color: TEXT_SECONDARY, alpha: 0.3 });
    this.addChild(divider);
    cursor += isMobile ? 16 : 20;

    // "Full Standings" label
    standingsLabel.anchor.set(0.5, 0);
    standingsLabel.x = cx;
    standingsLabel.y = cursor;
    this.addChild(standingsLabel);
    cursor += standingsLabel.height + (isMobile ? 8 : 12);

    // Column headers
    const colLeft = panelX + pad * 2;
    const colRight = panelX + panelW - pad * 2;
    const colXs = [colLeft + 8, colRight - 8];
    const headerLabels = ['Player', 'Score'];
    const headerAnchors = [0, 1];
    headerLabels.forEach((label, i) => {
      const t = new Text({
        text: label,
        style: { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY, fontWeight: 'bold' },
      });
      t.anchor.set(headerAnchors[i], 0);
      t.x = colXs[i];
      t.y = cursor;
      this.addChild(t);
    });
    cursor += isMobile ? 20 : 24;

    // ── Scrollable standings table ──
    const tableRowW = panelW - pad * 4;
    const sColXs = colXs.map((x) => x - panelX);
    const sColLeft = pad * 2;

    const rowContainers: Container[] = rows.map((row, idx) => {
      const rc = new Container();
      rc.boundsArea = new Rectangle(0, 0, panelW, rowH);

      if (idx % 2 === 1) {
        const rowBg = new Graphics();
        rowBg.roundRect(sColLeft, 0, tableRowW, rowH, 6);
        rowBg.fill({ color: ROW_HIGHLIGHT, alpha: 0.5 });
        rc.addChild(rowBg);
      }

      if (row.playerId === myPlayerId) {
        const hlBg = new Graphics();
        hlBg.roundRect(sColLeft, 0, tableRowW, rowH, 6);
        hlBg.fill({ color: GOLD, alpha: 0.08 });
        rc.addChild(hlBg);
      }

      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      const rankColor = idx === 0 ? GOLD : idx === 1 ? RANK_2ND : idx === 2 ? RANK_3RD : TEXT_PRIMARY;
      const displayName = truncName(row.name, isMobile ? 8 : row.name.length);

      const nameText = new Text({
        text: `${medal}  ${displayName}`,
        style: {
          fontSize: sizes.smallFontSize,
          fill: rankColor,
          fontWeight: idx < 3 ? 'bold' : 'normal',
        },
      });
      nameText.anchor.set(0, 0.5);
      nameText.x = sColXs[0];
      nameText.y = rowH / 2;
      rc.addChild(nameText);

      const scoreText = new Text({
        text: `${row.total}`,
        style: { fontSize: sizes.fontSize, fill: rankColor, fontWeight: 'bold' },
      });
      scoreText.anchor.set(1, 0.5);
      scoreText.x = sColXs[1];
      scoreText.y = rowH / 2;
      rc.addChild(scoreText);

      return rc;
    });

    const scrollBox = new ScrollBox({
      width: panelW,
      height: tableH,
      type: 'vertical',
      globalScroll: false,
      elementsMargin: 0,
      items: rowContainers,
    });
    scrollBox.x = panelX;
    scrollBox.y = cursor;
    this.addChild(scrollBox);

    const myIndex = rows.findIndex((r) => r.playerId === myPlayerId);
    if (myIndex >= maxVisibleRows) {
      scrollBox.scrollTo(myIndex);
    }

    cursor += tableH;

    // Footer
    cursor += isMobile ? 16 : 24;
    thanksText.anchor.set(0.5, 0);
    thanksText.x = cx;
    thanksText.y = cursor;
    this.addChild(thanksText);
  }
}
