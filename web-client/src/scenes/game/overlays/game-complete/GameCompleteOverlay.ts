import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../../types/game-types';
import { getResponsiveSizes, vw } from '../../../../utils/responsive';
import { BG_OVERLAY, BG_PANEL, GOLD, TEXT_SECONDARY } from '../../../../utils/colors';
import { createPodiumDisplay, PodiumEntry } from './PodiumDisplay';
import { createGameCompleteStandingsTable, GameStandingRow } from './GameCompleteStandingsTable';

function measureLayout(
    rows: GameStandingRow[],
    sizes: ReturnType<typeof getResponsiveSizes>,
    podiumCount: number,
) {
    const { isMobile } = sizes;
    const rowH = isMobile ? 44 : 52;
    const maxVisibleRows = isMobile ? 4 : 5;

    let h = 0;
    // title
    h += (isMobile ? 36 : 52) + (isMobile ? 16 : 24);
    // podium lines (approximate per-line height)
    for (let i = 0; i < podiumCount; i++) {
        h += (i === 0 ? (isMobile ? 28 : 40) : (isMobile ? 22 : 30)) + (isMobile ? 6 : 8);
    }
    h += isMobile ? 16 : 24; // gap after podium
    // divider
    h += 1 + (isMobile ? 16 : 20);
    // standings label
    h += sizes.smallFontSize + (isMobile ? 8 : 12);
    // column headers
    h += isMobile ? 20 : 24;
    // table
    h += Math.min(rows.length, maxVisibleRows) * rowH;
    // footer
    h += isMobile ? 16 : 24;
    h += sizes.smallFontSize; // thanks text
    h += isMobile ? 20 : 28; // bottom padding

    return h;
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
        const panelW = isMobile ? vw(96) : 700;

        // ── Build sorted standings ──
        const rows: GameStandingRow[] = [...gameState.players]
            .map((p) => {
                const profile = playerNames[p.id];
                const name = profile?.name || `Player ${p.naturalOrder + 1}`;
                return { playerId: p.id, name, total: p.totalScore };
            })
            .sort((a, b) => b.total - a.total);

        const podiumEntries: PodiumEntry[] = rows.slice(0, 3).map((r) => ({ name: r.name, total: r.total }));

        // ── Panel sizing ──
        const contentH = measureLayout(rows, sizes, podiumEntries.length);
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

        let cursor = panelY + panelPad;

        // ── Title ──
        const title = new Text({
            text: '🏆 Game Complete!',
            style: { fontSize: isMobile ? 36 : 52, fill: GOLD, fontWeight: 'bold' },
        });
        title.anchor.set(0.5, 0);
        title.x = cx;
        title.y = cursor;
        this.addChild(title);
        cursor += title.height + (isMobile ? 16 : 24);

        // ── Podium ──
        const podium = createPodiumDisplay(podiumEntries, cx, cursor, sizes);
        this.addChild(podium.container);
        cursor += podium.height;
        cursor += isMobile ? 16 : 24; // gap after podium

        // ── Divider ──
        const divider = new Graphics();
        divider.moveTo(panelX + pad * 3, cursor);
        divider.lineTo(panelX + panelW - pad * 3, cursor);
        divider.stroke({ width: 1, color: TEXT_SECONDARY, alpha: 0.3 });
        this.addChild(divider);
        cursor += isMobile ? 16 : 20;

        // ── "Full Standings" label ──
        const standingsLabel = new Text({
            text: 'Full Standings',
            style: { fontSize: sizes.smallFontSize, fill: TEXT_SECONDARY, fontWeight: 'bold' },
        });
        standingsLabel.anchor.set(0.5, 0);
        standingsLabel.x = cx;
        standingsLabel.y = cursor;
        this.addChild(standingsLabel);
        cursor += standingsLabel.height + (isMobile ? 8 : 12);

        // ── Standings table ──
        const table = createGameCompleteStandingsTable({
            rows, myPlayerId, panelX, panelW, startY: cursor, sizes,
        });
        this.addChild(table.container);
        cursor += table.height;

        // ── Footer ──
        cursor += isMobile ? 16 : 24;
        const thanksText = new Text({
            text: 'Thanks for playing!',
            style: { fontSize: sizes.smallFontSize, fill: TEXT_SECONDARY },
        });
        thanksText.anchor.set(0.5, 0);
        thanksText.x = cx;
        thanksText.y = cursor;
        this.addChild(thanksText);
    }
}
