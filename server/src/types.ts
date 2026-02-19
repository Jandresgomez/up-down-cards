export interface Room {
  id: string;
  adminId: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  numberOfRounds: number;
  maxPlayers: number;
  players: Player[];
  currentRound: number;
}

export interface Player {
  id: string;
  joinedAt: number;
  isAdmin: boolean;
}
