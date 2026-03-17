import { Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { getResponsiveSizes, isMobile } from '../../../utils/responsive';
import { TEXT_PRIMARY } from '../../../utils/colors';

export class RoundTitle extends Text {
    constructor() {
        super({
            text: '',
            style: { fontSize: getResponsiveSizes().titleSize, fill: TEXT_PRIMARY, fontWeight: 'bold' }
        });
    }

    updateFromState(gameState: GameState): void {
        if (!gameState.currentRound) {
            this.text = '';
            return;
        }
        const round = gameState.currentRound;
        const direction = round.roundIndex < gameState.roundSequence.length / 2 ? '⬆️' : '⬇️';
        this.text = `Round ${round.roundNumber} of ${gameState.numberOfRounds} ${direction}`;
    }
}
