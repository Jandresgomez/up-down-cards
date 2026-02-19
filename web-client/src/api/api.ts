import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getPlayerId } from '../utils/playerId';

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
}

const createRoomFn = httpsCallable<{ playerId: string }, CreateRoomResponse>(functions, 'createRoom');
const joinRoomFn = httpsCallable<{ roomId: string; playerId: string }, JoinRoomResponse>(functions, 'joinRoom');
const updateRoomSettingsFn = httpsCallable<{ roomId: string; playerId: string; numberOfRounds?: number; maxPlayers?: number }, UpdateRoomSettingsResponse>(functions, 'updateRoomSettings');
const startGameFn = httpsCallable<{ roomId: string; playerId: string }, StartGameResponse>(functions, 'startGame');

export async function createNewRoom(): Promise<CreateRoomResponse> {
  const playerId = getPlayerId();
  const result = await createRoomFn({ playerId });
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
