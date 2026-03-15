import { Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { isMobile } from '../../../utils/responsive';

export class RoundTitle extends Text {
    constructor() {
        super({
            text: '',
            style: { fontSize: isMobile() ? 16 : 20, fill: 0xffffff, fontWeight: 'bold' }
        });
    }

    updateFromState(gameState: GameState): void {
        if (!gameState.currentRound) {
            this.text = '';
            return;
        }
        const round = gameState.currentRound;
        const direction = round.roundIndex < gameState.roundSequence.length / 2 ? 'Going Up' : 'Going Down';
        this.text = `Round ${round.roundNumber} of ${gameState.numberOfRounds} (${direction})`;
    }
}
