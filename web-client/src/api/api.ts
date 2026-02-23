import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getPlayerId } from '../utils/playerId';
import { Card } from '../types/game-types';

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

const createRoomFn = httpsCallable<{ playerId: string; numberOfRounds?: number }, CreateRoomResponse>(functions, 'createRoom');
const joinRoomFn = httpsCallable<{ roomId: string; playerId: string }, JoinRoomResponse>(functions, 'joinRoom');
const updateRoomSettingsFn = httpsCallable<{ roomId: string; playerId: string; numberOfRounds?: number; maxPlayers?: number }, UpdateRoomSettingsResponse>(functions, 'updateRoomSettings');
const startGameFn = httpsCallable<{ roomId: string; playerId: string }, StartGameResponse>(functions, 'startGame');
const placeBetFn = httpsCallable<{ playerId: string; bet: number }, PlaceBetResponse>(functions, 'placeBet');
const playCardFn = httpsCallable<{ playerId: string; card: Card }, PlayCardResponse>(functions, 'playCard');
const continueGameFn = httpsCallable<{ playerId: string }, ContinueGameResponse>(functions, 'continueGame');
const leaveRoomFn = httpsCallable<{ roomId: string; playerId: string }, LeaveRoomResponse>(functions, 'leaveRoom');
const closeRoomFn = httpsCallable<{ roomId: string; playerId: string }, CloseRoomResponse>(functions, 'closeRoom');

export async function createNewRoom(numberOfRounds: number = 5): Promise<CreateRoomResponse> {
  const playerId = getPlayerId();
  const result = await createRoomFn({ playerId, numberOfRounds });
  return result.data;
}

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  if (!roomId || roomId.trim() === '') {
    return {
      success: false,
      error: 'Provided room ID is not valid'
    };
  }
  
  const playerId = getPlayerId();
  const result = await joinRoomFn({ roomId, playerId });
  return result.data;
}

export async function updateRoomSettings(roomId: string, settings: { numberOfRounds?: number; maxPlayers?: number }): Promise<UpdateRoomSettingsResponse> {
  const playerId = getPlayerId();
  const result = await updateRoomSettingsFn({ roomId, playerId, ...settings });
  return result.data;
}

export async function startGame(roomId: string): Promise<StartGameResponse> {
  const playerId = getPlayerId();
  const result = await startGameFn({ roomId, playerId });
  return result.data;
}

export async function placeBet(bet: number): Promise<PlaceBetResponse> {
  const playerId = getPlayerId();
  const result = await placeBetFn({ playerId, bet });
  return result.data;
}

export async function playCard(card: Card): Promise<PlayCardResponse> {
  const playerId = getPlayerId();
  const result = await playCardFn({ playerId, card });
  return result.data;
}

export async function continueGame(): Promise<ContinueGameResponse> {
  const playerId = getPlayerId();
  const result = await continueGameFn({ playerId });
  return result.data;
}

export async function leaveRoom(roomId: string): Promise<LeaveRoomResponse> {
  const playerId = getPlayerId();
  const result = await leaveRoomFn({ roomId, playerId });
  return result.data;
}

export async function closeRoom(roomId: string): Promise<CloseRoomResponse> {
  const playerId = getPlayerId();
  const result = await closeRoomFn({ roomId, playerId });
  return result.data;
}
