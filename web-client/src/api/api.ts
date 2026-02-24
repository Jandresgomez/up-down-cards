import { getPlayerId } from '../utils/playerId';
import { Card } from '../types/game-types';

// API Base URL - defaults to localhost in dev, uses env variable in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CreateRoomResponse {
  roomId: string;
  success: boolean;
}

export interface JoinRoomResponse {
  success: boolean;
  error?: string;
}

export interface UpdateRoomSettingsResponse {
  success: boolean;
  error?: string;
}

export interface StartGameResponse {
  success: boolean;
  error?: string;
  status?: string;
}

export interface PlaceBetResponse {
  success: boolean;
  error?: string;
}

export interface PlayCardResponse {
  success: boolean;
  error?: string;
}

export interface ContinueGameResponse {
  success: boolean;
  error?: string;
}

export interface LeaveRoomResponse {
  success: boolean;
  error?: string;
  roomDeleted?: boolean;
}

export interface CloseRoomResponse {
  success: boolean;
  error?: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export async function createNewRoom(numberOfRounds: number = 5): Promise<CreateRoomResponse> {
  const playerId = getPlayerId();
  return apiCall<CreateRoomResponse>('/createRoom', { playerId, numberOfRounds });
}

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  if (!roomId || roomId.trim() === '') {
    return {
      success: false,
      error: 'Provided room ID is not valid'
    };
  }
  
  const playerId = getPlayerId();
  return apiCall<JoinRoomResponse>('/joinRoom', { roomId, playerId });
}

export async function updateRoomSettings(roomId: string, settings: { numberOfRounds?: number; maxPlayers?: number }): Promise<UpdateRoomSettingsResponse> {
  const playerId = getPlayerId();
  return apiCall<UpdateRoomSettingsResponse>('/updateRoomSettings', { roomId, playerId, ...settings });
}

export async function startGame(roomId: string): Promise<StartGameResponse> {
  const playerId = getPlayerId();
  return apiCall<StartGameResponse>('/startGame', { roomId, playerId });
}

export async function placeBet(bet: number): Promise<PlaceBetResponse> {
  const playerId = getPlayerId();
  return apiCall<PlaceBetResponse>('/placeBet', { playerId, bet });
}

export async function playCard(card: Card): Promise<PlayCardResponse> {
  const playerId = getPlayerId();
  return apiCall<PlayCardResponse>('/playCard', { playerId, card });
}

export async function continueGame(): Promise<ContinueGameResponse> {
  const playerId = getPlayerId();
  return apiCall<ContinueGameResponse>('/continueGame', { playerId });
}

export async function leaveRoom(roomId: string): Promise<LeaveRoomResponse> {
  const playerId = getPlayerId();
  return apiCall<LeaveRoomResponse>('/leaveRoom', { roomId, playerId });
}

export async function closeRoom(roomId: string): Promise<CloseRoomResponse> {
  const playerId = getPlayerId();
  return apiCall<CloseRoomResponse>('/closeRoom', { roomId, playerId });
}
