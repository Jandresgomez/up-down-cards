import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../../types/game-types';
import { Button } from '../../components/Button';
import { getResponsiveSizes } from '../../../../utils/responsive';
import { BG_OVERLAY, BG_PANEL, SUCCESS, DISABLED, TEXT_SECONDARY } from '../../../../utils/colors';
import { createUserScoreSummary } from './UserScoreSummary';
import { createStandingsTable, StandingsRow } from './StandingsTable';

function measureLayout(
    myRow: StandingsRow | undefined,
    rows: StandingsRow[],
    sizes: ReturnType<typeof getResponsiveSizes>,
) {
    const { isMobile } = sizes;
    const rowH = isMobile ? 48 : 56;
    const maxVisibleRows = isMobile ? 4 : 5;

    let h = 0;
    h += sizes.titleSize + (isMobile ? 20 : 28);
    if (myRow) {
        h += sizes.fontSize + (isMobile ? 4 : 6);
        h += sizes.smallFontSize + (isMobile ? 24 : 32);
    }
    h += 1 + (isMobile ? 20 : 28);           // divider
    h += (isMobile ? 22 : 26);               // column headers
    h += Math.min(rows.length, maxVisibleRows) * rowH; // table
    h += isMobile ? 20 : 28;                 // footer gap
    h += sizes.smallFontSize + (isMobile ? 10 : 14); // ready text
    h += sizes.buttonMedium.height + sizes.padding;   // button

    return { contentH: h };
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

        // ── Build row data ──
        const rows: StandingsRow[] = gameState.players
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

        // ── Panel sizing ──
        const layout = measureLayout(myRow, rows, sizes);
        const panelH = layout.contentH + panelPad * 2;
        const panelX = (sw - panelW) / 2;
        const panelY = (sh - panelH) / 2;
        const cx = panelX + panelW / 2;

        // ── Background overlay ──
        const bg = new Graphics();
        bg.rect(0, 0, sw, sh);
        bg.fill({ color: BG_OVERLAY, alpha: 0.8 });
        this.addChild(bg);

        // ── Panel ──
        const panelBg = new Graphics();
        panelBg.roundRect(panelX, panelY, panelW, panelH, 16);
        panelBg.fill(BG_PANEL);
        panelBg.stroke({ width: 3, color: SUCCESS });
        this.addChild(panelBg);

        let cursor = panelY + panelPad;

        // ── Title ──
        const title = new Text({
            text: `Round ${gameState.currentRound.roundNumber} Complete`,
            style: { fontSize: sizes.titleSize, fill: SUCCESS, fontWeight: 'bold' },
        });
        title.anchor.set(0.5, 0);
        title.x = cx;
        title.y = cursor;
        this.addChild(title);
        cursor += title.height + (isMobile ? 20 : 28);

        // ── User score summary ──
        if (myRow) {
            const summary = createUserScoreSummary(
                { delivered: myRow.delivered, bet: myRow.bet, won: myRow.won, points: myRow.points, total: myRow.total, rank: myRank },
                cx, cursor, sizes,
            );
            this.addChild(summary.container);
            cursor += summary.height;
        }

        // ── Divider ──
        const divider = new Graphics();
        divider.moveTo(panelX + pad * 3, cursor);
        divider.lineTo(panelX + panelW - pad * 3, cursor);
        divider.stroke({ width: 1, color: TEXT_SECONDARY, alpha: 0.3 });
        this.addChild(divider);
        cursor += isMobile ? 20 : 28;

        // ── Standings table ──
        const table = createStandingsTable({
            rows, myPlayerId, panelX, panelW, startY: cursor, sizes,
        });
        this.addChild(table.container);
        cursor += table.height;

        // ── Footer: ready count + continue button ──
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
