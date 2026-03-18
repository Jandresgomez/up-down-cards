import { Container, Graphics, styleAttributes, Text } from "pixi.js";
import { TEXT_PRIMARY, TEXT_SECONDARY } from "../../../utils/colors";
import { getResponsiveSizes } from "../../../utils/responsive";

export class WaitingPlayersList extends Container {
    players: string[] = [];
    maxPlayers: number;


    constructor(players: string[] = [], maxPlayers: number) {
        super();
        this.players = players;
        this.maxPlayers = maxPlayers;
        this.render();
    }

    render() {
        this.removeChildren();
        const sizes = getResponsiveSizes()
        const innerWidth = (() => {
            let baseWidth = sizes.isMobile ? 200 : 400;
            if (this.players.length > 4) {
                baseWidth = sizes.isMobile ? 400 : 600;
            }
            return Math.min(baseWidth, sizes.width - sizes.spacing * 2)
        })();
        const xOffset = (sizes.width - innerWidth) / 2;
        const topPadding = sizes.padding;

        const allPlayersText = new Text({
            text: `Players (${this.players.length} / ${this.maxPlayers}):`,
            style: { fill: TEXT_PRIMARY, fontSize: sizes.fontSize, fontWeight: 'bold' }
        });
        allPlayersText.anchor.set(0.5, 0);
        allPlayersText.x = sizes.width / 2;
        allPlayersText.y = topPadding;
        this.addChild(allPlayersText);

        let currentY = allPlayersText.y + allPlayersText.height + sizes.padding;
        let lastTextHeight: number = 0;

        if (this.players.length > 4) {
            this.players.forEach((player, index) => {
                const playerText = new Text({
                    text: player,
                    style: { fill: TEXT_PRIMARY, fontSize: sizes.fontSize }
                });
                playerText.anchor.set(0.5, 0);
                playerText.x = (index % 2 == 0) ?
                    xOffset + (innerWidth / 4) :
                    xOffset + (3 * innerWidth / 4); // Two centered columns
                playerText.y = currentY;
                if (index % 2 === 1) {
                    currentY += playerText.height + sizes.padding; // Move to next row after every 2 players
                    lastTextHeight = 0; // No need to account for last text height for the bounding rect
                } else {
                    lastTextHeight = playerText.height;
                }
                this.addChild(playerText);
            });
        } else {
            this.players.forEach((player, index) => {
                const playerText = new Text({
                    text: player,
                    style: { fill: TEXT_PRIMARY, fontSize: sizes.fontSize }
                });
                playerText.anchor.set(0.5, 0);
                playerText.x = sizes.width / 2;
                playerText.y = currentY;
                currentY += playerText.height + sizes.padding;
                this.addChild(playerText);
            });
        }

        const bg = new Graphics();
        bg.roundRect(
            xOffset,
            0,
            innerWidth,
            currentY + lastTextHeight + topPadding,
            16
        );
        bg.stroke({ width: 2, color: TEXT_SECONDARY });
        this.addChild(bg);
    }

    updatePlayers(players: string[]) {
        this.players = players;
        this.render();
    }

    updateMaxPlayers(maxPlayers: number) {
        this.maxPlayers = maxPlayers;
        this.render();
    }
}