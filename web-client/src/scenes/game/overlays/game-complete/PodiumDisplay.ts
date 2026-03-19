import { Container, Text } from 'pixi.js';
import { ResponsiveSizes } from '../../../../utils/responsive';
import { GOLD, RANK_2ND, RANK_3RD } from '../../../../utils/colors';

function truncName(name: string, maxChars: number): string {
    return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
}

export interface PodiumEntry {
    name: string;
    total: number;
}

const PODIUM_CONFIG: { medal: string; color: number; mobileFontSize: number; desktopFontSize: number }[] = [
    { medal: '🥇', color: GOLD, mobileFontSize: 28, desktopFontSize: 40 },
    { medal: '🥈', color: RANK_2ND, mobileFontSize: 22, desktopFontSize: 30 },
    { medal: '🥉', color: RANK_3RD, mobileFontSize: 22, desktopFontSize: 30 },
];

/**
 * Renders the top-3 podium lines (medal + name + pts).
 * Returns the container and total height consumed.
 */
export function createPodiumDisplay(
    entries: PodiumEntry[],
    cx: number,
    startY: number,
    sizes: ResponsiveSizes,
): { container: Container; height: number } {
    const { isMobile } = sizes;
    const c = new Container();
    let cursor = 0;
    const count = Math.min(entries.length, 3);

    for (let i = 0; i < count; i++) {
        const entry = entries[i];
        const cfg = PODIUM_CONFIG[i];
        const fontSize = isMobile ? cfg.mobileFontSize : cfg.desktopFontSize;
        const displayName = truncName(entry.name, isMobile ? 10 : entry.name.length);

        const t = new Text({
            text: `${cfg.medal}  ${displayName}  —  ${entry.total} pts`,
            style: { fontSize, fill: cfg.color, fontWeight: i === 0 ? 'bold' : 'normal' },
        });
        t.anchor.set(0.5, 0);
        t.x = cx;
        t.y = startY + cursor;
        c.addChild(t);
        cursor += t.height + (isMobile ? 6 : 8);
    }

    return { container: c, height: cursor };
}
