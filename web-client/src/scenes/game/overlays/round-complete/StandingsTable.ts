import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ResponsiveSizes } from '../../../../utils/responsive';
import {
    TEXT_PRIMARY, TEXT_SECONDARY, DELIVERED, FAILED,
    SCORE_POSITIVE, SCORE_ZERO, ROW_HIGHLIGHT, SUCCESS,
} from '../../../../utils/colors';
import { ScrollBox } from '@pixi/ui';

function truncName(name: string, maxChars: number): string {
    return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
}

export interface StandingsRow {
    playerId: string;
    name: string;
    bet: number;
    won: number;
    delivered: boolean;
    points: number;
    total: number;
}

export interface StandingsTableConfig {
    rows: StandingsRow[];
    myPlayerId: string;
    panelX: number;
    panelW: number;
    startY: number;
    sizes: ResponsiveSizes;
}

/**
 * Builds the column headers + scrollable standings table.
 * Returns the container and total height consumed.
 */
export function createStandingsTable(cfg: StandingsTableConfig): { container: Container; height: number } {
    const { rows, myPlayerId, panelX, panelW, startY, sizes } = cfg;
    const { isMobile, padding: pad } = sizes;
    const c = new Container();
    let cursor = 0;

    const rowH = isMobile ? 48 : 56;
    const maxVisibleRows = isMobile ? 4 : 5;

    // ── Measure data columns to give Player all remaining space ──
    const headerStyle = { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY, fontWeight: 'bold' as const };
    const cellStyle = { fontSize: sizes.smallFontSize, fill: TEXT_PRIMARY };
    const colGap = isMobile ? 10 : 14;

    // Total column
    let totalColW = new Text({ text: 'Total', style: headerStyle }).width;
    for (const r of rows) {
        const w = new Text({ text: `${r.total}`, style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY, fontWeight: 'bold' as const } }).width;
        if (w > totalColW) totalColW = w;
    }

    // Pts column
    let ptsColW = new Text({ text: 'Pts', style: headerStyle }).width;
    for (const r of rows) {
        const str = r.points > 0 ? `+${r.points}` : '+0';
        const w = new Text({ text: str, style: { ...cellStyle, fontWeight: 'bold' as const } }).width;
        if (w > ptsColW) ptsColW = w;
    }

    // Bet/Won column
    let betColW = new Text({ text: 'Bet/Won', style: headerStyle }).width;
    for (const r of rows) {
        const w = new Text({ text: `${r.bet} / ${r.won}`, style: cellStyle }).width;
        if (w > betColW) betColW = w;
    }

    const tableInset = pad * 2;
    const colRight = panelX + panelW - tableInset;
    const colLeft = panelX + tableInset;

    const totalColRight = colRight;
    const ptsColRight = totalColRight - totalColW - colGap;
    const betColCenter = ptsColRight - ptsColW - colGap - betColW / 2;
    const playerColLeft = colLeft + 8;

    // ── Column headers ──
    const makeHeader = (text: string, x: number, anchorX: number) => {
        const t = new Text({ text, style: headerStyle });
        t.anchor.set(anchorX, 0);
        t.x = x;
        t.y = startY + cursor;
        c.addChild(t);
    };
    makeHeader('Player', playerColLeft, 0);
    makeHeader('Bet/Won', betColCenter, 0.5);
    makeHeader('Pts', ptsColRight, 1);
    makeHeader('Total', totalColRight, 1);
    cursor += isMobile ? 22 : 26;

    // ── Scrollable rows ──
    const tableRowW = panelW - tableInset * 2;
    const sColLeft = tableInset;
    const sPlayerX = playerColLeft - panelX;
    const sBetX = betColCenter - panelX;
    const sPtsX = ptsColRight - panelX;
    const sTotalX = totalColRight - panelX;
    const tableH = Math.min(rows.length, maxVisibleRows) * rowH;

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
        nameText.x = sPlayerX;
        nameText.y = rowH / 2;
        rc.addChild(nameText);

        const betWonText = new Text({
            text: `${row.bet} / ${row.won}`,
            style: { fontSize: sizes.smallFontSize, fill: TEXT_PRIMARY },
        });
        betWonText.anchor.set(0.5, 0.5);
        betWonText.x = sBetX;
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
        ptsText.x = sPtsX;
        ptsText.y = rowH / 2;
        rc.addChild(ptsText);

        const totalText = new Text({
            text: `${row.total}`,
            style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY, fontWeight: 'bold' },
        });
        totalText.anchor.set(1, 0.5);
        totalText.x = sTotalX;
        totalText.y = rowH / 2;
        rc.addChild(totalText);

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
    scrollBox.y = startY + cursor;
    c.addChild(scrollBox);

    // Auto-scroll to viewer's row
    const myIndex = rows.findIndex((r) => r.playerId === myPlayerId);
    if (myIndex >= maxVisibleRows) {
        scrollBox.scrollTo(myIndex);
    }

    cursor += tableH;

    return { container: c, height: cursor };
}
