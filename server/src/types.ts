export interface Room {
  id: string;
  adminId: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  numberOfRounds: number;
  maxPlayers: number;
  players: string[];
}

export interface Player {
  id: string;
  roomId: string;
  joinedAt: number;
}
