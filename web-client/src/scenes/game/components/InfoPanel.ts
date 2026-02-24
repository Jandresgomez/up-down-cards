import { Container, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';

export class InfoPanel extends Container {
  private roundText: Text;
  private scoresText: Text;

  constructor() {
    super();

    this.roundText = new Text({
      text: '',
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.roundText.x = 20;
    this.roundText.y = 20;
    this.addChild(this.roundText);

    this.scoresText = new Text({
      text: '',
      style: { fontSize: 18, fill: 0xaaaaaa }
    });
    this.scoresText.anchor.set(1, 0);
    this.scoresText.y = 20;
    this.addChild(this.scoresText);
  }

  update(gameState: GameState, myPlayerId: string, screenWidth: number): void {
    const { currentRound, players, numberOfRounds, roundSequence } = gameState;

    // Round info only
    if (currentRound) {
      const currentIndex = currentRound.roundIndex;
      const direction = currentIndex < roundSequence.length / 2 ? 'Going Up' : 'Going Down';
      this.roundText.text = `Round ${currentRound.roundNumber} of ${numberOfRounds} (${direction})`;
    }

    // Scores
    this.scoresText.x = screenWidth - 20;
    const scoresLines = players.map((p, i) => {
      const bet = p.bet !== null ? p.bet : '-';
      const won = p.handsWon;
      return `P${i + 1}: ${p.totalScore}pts (Bet: ${bet}, Won: ${won})`;
    });
    this.scoresText.text = scoresLines.join('\n');
  }
}
