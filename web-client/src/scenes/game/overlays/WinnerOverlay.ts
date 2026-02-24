import { Container, Graphics, Text } from 'pixi.js';
import { GameState, SUIT_SYMBOLS, SUIT_COLORS } from '../../../types/game-types';
import { Button } from '../components/Button';

export class WinnerOverlay extends Container {
  constructor(gameState: GameState, myPlayerId: string, onContinue: () => void) {
    super();

    if (!gameState.currentRound) return;

    const lastHand = gameState.currentRound.completedHands[
      gameState.currentRound.completedHands.length - 1
    ];
    if (!lastHand) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const panelBg = new Graphics();
    panelBg.roundRect(-300, -300, 600, 600, 20);
    panelBg.fill(0x1a1a2e);
    panelBg.stroke({ width: 4, color: 0xffd700 });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Hand Winner!',
      style: { fontSize: 48, fill: 0xffd700, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -240;
    panel.addChild(title);

    // Winner info
    const winnerIndex = gameState.players.findIndex(p => p.id === lastHand.winnerId);
    const winnerText = new Text({
      text: `Player ${winnerIndex + 1} wins!`,
      style: { fontSize: 32, fill: 0xffffff }
    });
    winnerText.anchor.set(0.5);
    winnerText.y = -180;
    panel.addChild(winnerText);

    // Winning card
    const cardText = new Text({
      text: `${lastHand.winningCard.rank}${SUIT_SYMBOLS[lastHand.winningCard.suit]}`,
      style: { fontSize: 64, fill: SUIT_COLORS[lastHand.winningCard.suit], fontWeight: 'bold' }
    });
    cardText.anchor.set(0.5);
    cardText.y = -80;
    panel.addChild(cardText);

    // All cards played
    let yPos = 20;
    lastHand.cardsPlayed.forEach(pc => {
      const playerIndex = gameState.players.findIndex(p => p.id === pc.playerId);
      const isWinner = pc.playerId === lastHand.winnerId;
      const cardStr = `P${playerIndex + 1}: ${pc.card.rank}${SUIT_SYMBOLS[pc.card.suit]}`;
      
      const cardLine = new Text({
        text: cardStr,
        style: { 
          fontSize: 20, 
          fill: isWinner ? 0xffd700 : 0xffffff,
          fontWeight: isWinner ? 'bold' : 'normal'
        }
      });
      cardLine.anchor.set(0.5);
      cardLine.y = yPos;
      panel.addChild(cardLine);
      yPos += 35;
    });

    // Ready status
    const playersReady = gameState.currentRound.currentHand?.playersReady || [];
    const readyText = new Text({
      text: `Ready: ${playersReady.length}/${gameState.players.length}`,
      style: { fontSize: 20, fill: 0xaaaaaa }
    });
    readyText.anchor.set(0.5);
    readyText.y = yPos + 20;
    panel.addChild(readyText);

    // Continue button
    const hasClicked = playersReady.includes(myPlayerId);
    const continueBtn = new Button(
      hasClicked ? 'Waiting...' : 'Continue',
      200,
      60,
      hasClicked ? 0x666666 : 0x4caf50
    );
    continueBtn.x = -100;
    continueBtn.y = yPos + 70;
    if (!hasClicked) {
      continueBtn.on('pointerdown', onContinue);
    }
    panel.addChild(continueBtn);

    this.addChild(panel);
  }
}
