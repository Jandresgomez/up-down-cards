import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../../types/game-types';
import { isMobile } from '../../../utils/responsive';
import { BG_OVERLAY, BG_PANEL, GOLD, RANK_2ND, RANK_3RD, TEXT_PRIMARY, TEXT_SECONDARY } from '../../../utils/colors';

export class GameCompleteOverlay extends Container {
  constructor(gameState: GameState, playerNames: Record<string, { name: string }> = {}) {
    super();

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const mobile = isMobile();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight);
    bg.fill({ color: BG_OVERLAY, alpha: 0.9 });
    this.addChild(bg);

    // Panel
    const panel = new Container();
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const panelWidth = mobile ? screenWidth * 0.85 : 700;
    const panelHeight = mobile ? screenHeight * 0.7 : 700;
    const panelBg = new Graphics();
    panelBg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
    panelBg.fill(BG_PANEL);
    panelBg.stroke({ width: 4, color: GOLD });
    panel.addChild(panelBg);

    // Title
    const title = new Text({
      text: 'Game Complete!',
      style: { fontSize: mobile ? 36 : 56, fill: GOLD, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.y = -panelHeight / 2 + (mobile ? 50 : 70);
    panel.addChild(title);

    // Sort players by score
    const rankedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);

    // Display rankings
    let yPos = title.y + (mobile ? 60 : 80);
    rankedPlayers.forEach((player, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      const profile = playerNames[player.id];
      const label = profile?.name || `P${gameState.players.findIndex(p => p.id === player.id) + 1}`;

      const rankText = new Text({
        text: `${medal} ${label}: ${player.totalScore} pts`,
        style: {
          fontSize: mobile ? (rank === 1 ? 24 : 18) : (rank === 1 ? 36 : 28),
          fill: rank === 1 ? GOLD : rank === 2 ? RANK_2ND : rank === 3 ? RANK_3RD : TEXT_PRIMARY,
          fontWeight: rank === 1 ? 'bold' : 'normal'
        }
      });
      rankText.anchor.set(0.5);
      rankText.y = yPos;
      panel.addChild(rankText);
      yPos += mobile ? (rank === 1 ? 40 : 35) : (rank === 1 ? 60 : 50);
    });

    // Thank you message
    const thanksText = new Text({
      text: 'Thanks for playing!',
      style: { fontSize: mobile ? 18 : 24, fill: TEXT_SECONDARY }
    });
    thanksText.anchor.set(0.5);
    thanksText.y = panelHeight / 2 - (mobile ? 40 : 70);
    panel.addChild(thanksText);

    this.addChild(panel);
  }
}
