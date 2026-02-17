type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardValue = `${Rank}${Suit}`;

type GameScreen = 'welcome' | 'waiting' | 'game';

export class GameState {
  private currentScreen: GameScreen = 'welcome';
  private roomNumber: string | null = null;
  private isAdmin: boolean = false;
  private playerHand: CardValue[] = [];
  private tableCards: CardValue[] = [];
  private numberOfPlayers: number = 1;
  private numberOfRounds: number = 1;
  private currentRound: number = 1;

  getCurrentScreen(): GameScreen {
    return this.currentScreen;
  }

  getRoomNumber(): string | null {
    return this.roomNumber;
  }

  isRoomAdmin(): boolean {
    return this.isAdmin;
  }

  getNumberOfPlayers(): number {
    return this.numberOfPlayers;
  }

  getNumberOfRounds(): number {
    return this.numberOfRounds;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  getMaxRounds(): number {
    return Math.floor(51 / this.numberOfPlayers);
  }

  setNumberOfRounds(rounds: number): void {
    const maxRounds = this.getMaxRounds();
    this.numberOfRounds = Math.max(1, Math.min(rounds, maxRounds));
  }

  setNumberOfPlayers(players: number): void {
    this.numberOfPlayers = players;
  }

  joinRoom(roomNumber: string): void {
    this.roomNumber = roomNumber;
    this.isAdmin = false;
    this.currentScreen = 'waiting';
  }

  async createRoom(): Promise<string> {
    this.isAdmin = true;
    this.currentScreen = 'waiting';
    return this.roomNumber!;
  }

  startGame(): void {
    this.currentScreen = 'game';
    this.currentRound = 1;
    this.initializeGame();
  }

  setRoomNumber(roomNumber: string): void {
    this.roomNumber = roomNumber;
  }

  private initializeGame(): void {
    // Initialize with sample hand for now
    this.playerHand = ['A♠', 'K♥', 'Q♦', '10♣', 'J♠'];
  }

  getPlayerHand(): CardValue[] {
    return [...this.playerHand];
  }
}
