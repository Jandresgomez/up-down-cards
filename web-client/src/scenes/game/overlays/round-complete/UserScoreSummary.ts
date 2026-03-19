import { Container, Text } from 'pixi.js';
import { ResponsiveSizes } from '../../../../utils/responsive';
import { DELIVERED, FAILED, SCORE_POSITIVE, SCORE_ZERO } from '../../../../utils/colors';

export interface UserScoreData {
    delivered: boolean;
    bet: number;
    won: number;
    points: number;
    total: number;
    rank: number;
}

/**
 * Personal round summary: delivery status + score diff.
 * Returns the container and its total height so the parent can advance the cursor.
 */
export function createUserScoreSummary(
    data: UserScoreData,
    cx: number,
    startY: number,
    sizes: ResponsiveSizes,
): { container: Container; height: number } {
    const { isMobile } = sizes;
    const c = new Container();
    let cursor = 0;

    const statusLabel = data.delivered ? 'Delivered' : 'Failed';
    const statusColor = data.delivered ? DELIVERED : FAILED;
    const statusEmoji = data.delivered ? '✅' : '❌';

    const line1 = new Text({
        text: `${statusEmoji}  You ${statusLabel}!  (Bet ${data.bet}, Won ${data.won})`,
        style: { fontSize: sizes.fontSize, fill: statusColor, fontWeight: 'bold' },
    });
    line1.anchor.set(0.5, 0);
    line1.x = cx;
    line1.y = startY + cursor;
    c.addChild(line1);
    cursor += line1.height + (isMobile ? 4 : 6);

    const diffStr = data.points > 0 ? `+${data.points}` : '+0';
    const line2 = new Text({
        text: `${diffStr} pts  →  Total: ${data.total}   (Rank #${data.rank})`,
        style: {
            fontSize: sizes.smallFontSize,
            fill: data.points > 0 ? SCORE_POSITIVE : SCORE_ZERO,
        },
    });
    line2.anchor.set(0.5, 0);
    line2.x = cx;
    line2.y = startY + cursor;
    c.addChild(line2);
    cursor += line2.height + (isMobile ? 24 : 32);

    return { container: c, height: cursor };
}
