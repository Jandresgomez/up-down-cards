import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { Button } from '../components/Button';
import { getResponsiveSizes } from '../../../utils/responsive';
import {
  BG_OVERLAY, BG_PANEL, SUCCESS, DISABLED, TEXT_PRIMARY, TEXT_SECONDARY,
  DELIVERED, FAILED, SCORE_POSITIVE, SCORE_ZERO, ROW_HIGHLIGHT,
} from '../../../utils/colors';
import { ScrollBox } from '@pixi/ui';

function truncName(name: string, maxChars: number): string {
  return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
}

interface RowData {
  playerId: string;
  name: string;
  bet: number;
  won: number;
  delivered: boolean;
  points: number;
  total: number;
}

/**
 * Measures the content height by doing a dry-run layout.
 * Returns section heights so we can place everything at final positions in one pass.
 */
function measureLayout(
  gameState: GameState,
  myRow: RowData | undefined,
  rows: RowData[],
  sizes: ReturnType<typeof getResponsiveSizes>,
) {
  const { isMobile } = sizes;
  const rowH = isMobile ? 48 : 56;
  const maxVisibleRows = isMobile ? 4 : 5;

  let h = 0;

  // Title
  h += sizes.titleSize + (isMobile ? 20 : 28);

  // Personal summary (two lines)
  if (myRow) {
    h += sizes.fontSize + (isMobile ? 4 : 6);
    h += sizes.smallFontSize + (isMobile ? 24 : 32);
  }

  // Divider
  h += 1 + (isMobile ? 20 : 28);

  // Column headers
  h += (isMobile ? 22 : 26);

  // Table
  const tableH = Math.min(rows.length, maxVisibleRows) * rowH;
  const tableTop = h;
  h += tableH;

  // Footer
  h += isMobile ? 20 : 28;
  h += sizes.smallFontSize + (isMobile ? 10 : 14);
  // Button
  h += sizes.buttonMedium.height + sizes.padding;

  return { contentH: h, tableTop, tableH, rowH, maxVisibleRows };
}

export class RoundCompleteOverlay extends Container {
  constructor(
    gameState: GameState,
    myPlayerId: string,
    playerNames: Record<string, { name: string }>,
    onContinue: () => void,
  ) {
    super();
    if (!gameState.currentRound) return;

    const sizes = getResponsiveSizes();
    const { width: sw, height: sh, isMobile } = sizes;
    const pad = sizes.padding;
    const panelPad = isMobile ? 20 : 28;
    const panelW = isMobile ? sw * 0.9 : 520;

    // --- Pre-compute rows sorted by total ---
    const rows: RowData[] = gameState.players
      .map((player) => {
        const bet = player.bet ?? 0;
        const won = player.handsWon;
        const delivered = bet === won;
        const points = delivered ? 10 + 2 * won : 0;
        const profile = playerNames[player.id];
        const name = profile?.name || `Player ${player.naturalOrder + 1}`;
        return { playerId: player.id, name, bet, won, delivered, points, total: player.totalScore };
      })
      .sort((a, b) => b.total - a.total);

    const myRow = rows.find((r) => r.playerId === myPlayerId);
    const myRank = rows.findIndex((r) => r.playerId === myPlayerId) + 1;

    // --- Measure pass: figure out total height so we can center the panel ---
    const layout = measureLayout(gameState, myRow, rows, sizes);
    const panelH = layout.contentH + panelPad * 2;

    // Panel origin = top-left of the panel background
    const panelX = (sw - panelW) / 2;
    const panelY = (sh - panelH) / 2;
    // Content origin inside the panel
    const cx = panelX + panelW / 2; // horizontal center for centered text
    const cy = panelY + panelPad;   // top of content area

    // --- Background overlay ---
    const bg = new Graphics();
    bg.rect(0, 0, sw, sh);
    bg.fill({ color: BG_OVERLAY, alpha: 0.8 });
    this.addChild(bg);

    // --- Panel background ---
    const panelBg = new Graphics();
    panelBg.roundRect(panelX, panelY, panelW, panelH, 16);
    panelBg.fill(BG_PANEL);
    panelBg.stroke({ width: 3, color: SUCCESS });
    this.addChild(panelBg);

    // --- Lay out content at final absolute positions ---
    let cursor = cy;

    // Title
    const title = new Text({
      text: `Round ${gameState.currentRound.roundNumber} Complete`,
      style: { fontSize: sizes.titleSize, fill: SUCCESS, fontWeight: 'bold' },
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = cursor;
    this.addChild(title);
    cursor += title.height + (isMobile ? 20 : 28);

    // --- Personal summary ---
    if (myRow) {
      const statusLabel = myRow.delivered ? 'Delivered' : 'Failed';
      const statusColor = myRow.delivered ? DELIVERED : FAILED;
      const statusEmoji = myRow.delivered ? '✅' : '❌';

      const summaryLine1 = new Text({
        text: `${statusEmoji}  You ${statusLabel}!  (Bet ${myRow.bet}, Won ${myRow.won})`,
        style: { fontSize: sizes.fontSize, fill: statusColor, fontWeight: 'bold' },
      });
      summaryLine1.anchor.set(0.5, 0);
      summaryLine1.x = cx;
      summaryLine1.y = cursor;
      this.addChild(summaryLine1);
      cursor += summaryLine1.height + (isMobile ? 4 : 6);

      const diffStr = myRow.points > 0 ? `+${myRow.points}` : '+0';
      const summaryLine2 = new Text({
        text: `${diffStr} pts  →  Total: ${myRow.total}   (Rank #${myRank})`,
        style: {
          fontSize: sizes.smallFontSize,
          fill: myRow.points > 0 ? SCORE_POSITIVE : SCORE_ZERO,
        },
      });
      summaryLine2.anchor.set(0.5, 0);
      summaryLine2.x = cx;
      summaryLine2.y = cursor;
      this.addChild(summaryLine2);
      cursor += summaryLine2.height + (isMobile ? 24 : 32);
    }

    // --- Divider ---
    const divider = new Graphics();
    divider.moveTo(panelX + pad * 3, cursor);
    divider.lineTo(panelX + panelW - pad * 3, cursor);
    divider.stroke({ width: 1, color: TEXT_SECONDARY, alpha: 0.3 });
    this.addChild(divider);
    cursor += isMobile ? 20 : 28;

    // --- Column positions (absolute, relative to panelX) ---
    const colLeft = panelX + pad * 2;
    const colRight = panelX + panelW - pad * 2;
    const colXs = [
      colLeft + 8,
      colLeft + (panelW * 0.48),
      colRight - (isMobile ? 80 : 100),
      colRight - 8,
    ];
    const colAnchors: number[] = [0, 0.5, 1, 1];

    // --- Column headers ---
    const headerLabels = ['Player', 'Bet/Won', 'Pts', 'Total'];
    headerLabels.forEach((label, i) => {
      const t = new Text({
        text: label,
        style: { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY, fontWeight: 'bold' },
      });
      t.anchor.set(colAnchors[i], 0);
      t.x = colXs[i];
      t.y = cursor;
      this.addChild(t);
    });
    cursor += isMobile ? 22 : 26;

    // --- Scrollable table ---
    // Row columns are in ScrollBox-local coords (0..panelW)
    const tableRowW = panelW - pad * 4;
    const sColXs = colXs.map((x) => x - panelX); // convert absolute -> panel-local
    const sColLeft = pad * 2;
    const { rowH, tableH, maxVisibleRows } = layout;

    const rowContainers: Container[] = rows.map((row, idx) => {
      const rc = new Container();
      // Force consistent row size for List layout without drawing anything
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
        hlBg.fill({ color: SUCCESS, alpha: 0.1 });
        rc.addChild(hlBg);
      }

      const rankIcon = idx === 0 ? '👑' : `${idx + 1}.`;
      const statusEmoji = row.delivered ? '✅' : '❌';

      const nameText = new Text({
        text: `${rankIcon} ${truncName(row.name, isMobile ? 8 : row.name.length)} ${statusEmoji}`,
        style: {
          fontSize: sizes.smallFontSize,
          fill: row.delivered ? DELIVERED : FAILED,
          fontWeight: idx === 0 ? 'bold' : 'normal',
        },
      });
      nameText.anchor.set(0, 0.5);
      nameText.x = sColXs[0];
      nameText.y = rowH / 2;
      rc.addChild(nameText);

      const betWonText = new Text({
        text: `${row.bet} / ${row.won}`,
        style: { fontSize: sizes.smallFontSize, fill: TEXT_PRIMARY },
      });
      betWonText.anchor.set(0.5, 0.5);
      betWonText.x = sColXs[1];
      betWonText.y = rowH / 2;
      rc.addChild(betWonText);

      const diffStr = row.points > 0 ? `+${row.points}` : '+0';
      const ptsText = new Text({
        text: diffStr,
        style: {
          fontSize: sizes.smallFontSize,
          fill: row.points > 0 ? SCORE_POSITIVE : SCORE_ZERO,
          fontWeight: 'bold',
        },
      });
      ptsText.anchor.set(1, 0.5);
      ptsText.x = sColXs[2];
      ptsText.y = rowH / 2;
      rc.addChild(ptsText);

      const totalText = new Text({
        text: `${row.total}`,
        style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY, fontWeight: 'bold' },
      });
      totalText.anchor.set(1, 0.5);
      totalText.x = sColXs[3];
      totalText.y = rowH / 2;
      rc.addChild(totalText);

      return rc;
    });

    // Place ScrollBox directly at its final position — no parent repositioning
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

    // Scroll to the current player's row if it's off-screen
    const myIndex = rows.findIndex((r) => r.playerId === myPlayerId);
    if (myIndex >= maxVisibleRows) {
      scrollBox.scrollTo(myIndex);
    }

    cursor += tableH;

    // --- Footer ---
    cursor += isMobile ? 20 : 28;

    const playersReady = gameState.currentRound.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${gameState.players.length}`,
      style: { fontSize: sizes.smallFontSize, fill: TEXT_SECONDARY },
    });
    readyText.anchor.set(0.5, 0);
    readyText.x = cx;
    readyText.y = cursor;
    this.addChild(readyText);
    cursor += readyText.height + (isMobile ? 10 : 14);

    // Continue button
    const hasClicked = playersReady.includes(myPlayerId);
    const { width: btnW, height: btnH } = sizes.buttonMedium;
    const continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      btnW, btnH,
      hasClicked ? DISABLED : SUCCESS,
    );
    continueBtn.x = cx - btnW / 2;
    continueBtn.y = cursor;
    if (!hasClicked) {
      continueBtn.on('pointerdown', onContinue);
    }
    this.addChild(continueBtn);
  }
}
