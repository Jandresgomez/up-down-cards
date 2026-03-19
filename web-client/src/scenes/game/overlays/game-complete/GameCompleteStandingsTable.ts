import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ResponsiveSizes } from '../../../../utils/responsive';
import {
    TEXT_PRIMARY, TEXT_SECONDARY, ROW_HIGHLIGHT, GOLD, RANK_2ND, RANK_3RD,
} from '../../../../utils/colors';
import { ScrollBox } from '@pixi/ui';

export interface GameStandingRow {
    playerId: string;
    name: string;
    total: number;
}

export interface GameCompleteStandingsConfig {
    rows: GameStandingRow[];
    myPlayerId: string;
    panelX: number;
    panelW: number;
    startY: number;
    sizes: ResponsiveSizes;
}

/**
 * Builds column headers + scrollable standings for the game-complete overlay.
 * Two columns: Player (left) and Score (right).
 */
export function createGameCompleteStandingsTable(
    cfg: GameCompleteStandingsConfig,
): { container: Container; height: number } {
    const { rows, myPlayerId, panelX, panelW, startY, sizes } = cfg;
    const { isMobile, padding: pad } = sizes;
    const c = new Container();
    let cursor = 0;

    const rowH = isMobile ? 44 : 52;
    const maxVisibleRows = isMobile ? 4 : 5;
    const tableInset = pad * 2;
    const colLeft = panelX + tableInset + 8;
    const colRight = panelX + panelW - tableInset - 8;

    // ── Column headers ──
    const headerStyle = { fontSize: sizes.smallFontSize - 2, fill: TEXT_SECONDARY, fontWeight: 'bold' as const };
    const hPlayer = new Text({ text: 'Player', style: headerStyle });
    hPlayer.anchor.set(0, 0);
    hPlayer.x = colLeft;
    hPlayer.y = startY + cursor;
    c.addChild(hPlayer);

    const hScore = new Text({ text: 'Score', style: headerStyle });
    hScore.anchor.set(1, 0);
    hScore.x = colRight;
    hScore.y = startY + cursor;
    c.addChild(hScore);
    cursor += isMobile ? 20 : 24;

    // ── Measure score column to calculate available player space ──
    let scoreColW = new Text({ text: 'Score', style: headerStyle }).width;
    for (const r of rows) {
        const w = new Text({ text: `${r.total}`, style: { fontSize: sizes.fontSize, fill: TEXT_PRIMARY, fontWeight: 'bold' as const } }).width;
        if (w > scoreColW) scoreColW = w;
    }
    const colGap = isMobile ? 10 : 14;

    // ── Scrollable rows ──
    const tableRowW = panelW - tableInset * 2;
    const sColLeft = tableInset;
    const sPlayerX = colLeft - panelX;
    const sScoreX = colRight - panelX;
    const playerMaxW = sScoreX - scoreColW - colGap - sPlayerX;
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
            hlBg.fill({ color: GOLD, alpha: 0.08 });
            rc.addChild(hlBg);
        }

        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        const rankColor = idx === 0 ? GOLD : idx === 1 ? RANK_2ND : idx === 2 ? RANK_3RD : TEXT_PRIMARY;
        const nameStyle = {
            fontSize: sizes.smallFontSize,
            fill: rankColor,
            fontWeight: idx < 3 ? 'bold' as const : 'normal' as const,
        };

        const nameText = new Text({
            text: `${medal}  ${row.name}`,
            style: nameStyle,
        });
        nameText.anchor.set(0, 0.5);
        nameText.x = sPlayerX;
        nameText.y = rowH / 2;
        rc.addChild(nameText);

        const scoreText = new Text({
            text: `${row.total}`,
            style: { fontSize: sizes.fontSize, fill: rankColor, fontWeight: 'bold' },
        });
        scoreText.anchor.set(1, 0.5);
        scoreText.x = sScoreX;
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
    scrollBox.y = startY + cursor;
    c.addChild(scrollBox);

    const myIndex = rows.findIndex((r) => r.playerId === myPlayerId);
    if (myIndex >= maxVisibleRows) {
        scrollBox.scrollTo(myIndex);
    }

    cursor += tableH;

    return { container: c, height: cursor };
}
