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
  private maxPlayers: number = 4;
  private currentRound: number = 0;

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

  getMaxPlayers(): number {
    return this.maxPlayers;
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

  setMaxPlayers(maxPlayers: number): void {
    this.maxPlayers = maxPlayers;
  }

  setCurrentRound(round: number): void {
    this.currentRound = round;
  }

  joinRoom(roomNumber: string, isAdmin: boolean = false): void {
    this.roomNumber = roomNumber;
    this.isAdmin = isAdmin;
    this.currentScreen = 'waiting';
  }

  async createRoom(roomNumber: string): Promise<void> {
    this.roomNumber = roomNumber;
    this.isAdmin = true;
    this.currentScreen = 'waiting';
  }

  startGame(): void {
    this.currentScreen = 'game';
    if (this.currentRound === 0) {
      this.currentRound = 1;
    }
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
