import { Container, Text, TextStyle } from "pixi.js";
import { getResponsiveSizes } from "../../../../utils/responsive";
import { GameState } from "../../../../types/game-types";

export type MessageContent = {
    text: string;
    type: 'info' | 'error' | 'attention';
}

export class PlayerHandMessagePanel extends Container {
    private message: Text;
    private messageContent: MessageContent;
    private temporalMessageContent: MessageContent | null = null;
    private activeTimeout: NodeJS.Timeout | null = null;

    constructor(gameState: GameState) {
        super();
        this.message = new Text({
            text: '',
            style: this.getMessageStyle('info'),
        });
        this.messageContent = { text: '', type: 'info' };
        this.build(gameState);
    }

    build(gameState: GameState): void {
        const sizes = getResponsiveSizes();

        this.message.anchor.set(0.5, 0);
        this.message.x = sizes.width / 2;
        this.message.y = 0;
        this.addChild(this.message);
    }

    setMessage(content: MessageContent): void {
        this.messageContent = content;
        this.message.text = content.text;
        this.message.style = this.getMessageStyle(content.type);
    }

    setTemporalMessage(content: MessageContent, timeout: number): void {
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
            this.activeTimeout = null;
        }

        this.temporalMessageContent = content;
        this.message.text = content.text;
        this.message.style = this.getMessageStyle(content.type);

        this.activeTimeout = setTimeout(() => {
            if (this.temporalMessageContent === content) {
                this.temporalMessageContent = null;
                this.message.text = this.messageContent.text;
                this.message.style = this.getMessageStyle(this.messageContent.type);
            }
        }, timeout);
    }


    private getMessageStyle(type: MessageContent['type']): Partial<TextStyle> {
        const sizes = getResponsiveSizes();
        if (type === 'info') {
            return { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' };
        } else if (type === 'error') {
            return { fontSize: sizes.fontSize, fill: 0xff0000, fontWeight: 'bold' };
        } else if (type === 'attention') {
            return { fontSize: sizes.fontSize, fill: 0xffff00, fontWeight: 'bold' };
        }

        return { fontSize: sizes.fontSize, fill: 0xffffff, fontWeight: 'bold' };
    }
}