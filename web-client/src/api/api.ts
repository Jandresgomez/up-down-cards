import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export interface CreateRoomResponse {
  roomId: string;
  success: boolean;
}

export interface JoinRoomResponse {
  success: boolean;
  error?: string;
}

const createRoomFn = httpsCallable<void, CreateRoomResponse>(functions, 'createRoom');
const joinRoomFn = httpsCallable<{ roomId: string }, JoinRoomResponse>(functions, 'joinRoom');

export async function createNewRoom(): Promise<CreateRoomResponse> {
  const result = await createRoomFn();
  return result.data;
}

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  if (!roomId || roomId.trim() === '') {
    return {
      success: false,
      error: 'Provided room ID is not valid'
    };
  }
  
  const result = await joinRoomFn({ roomId });
  return result.data;
}
