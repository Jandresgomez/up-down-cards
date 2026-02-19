import { callFunction, CreateRoomResponse, JoinRoomResponse } from '../helpers';

describe('joinRoom', () => {
  let validRoomId: string;

  beforeEach(async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom');
    validRoomId = response.result!.roomId;
  });

  it('should successfully join an existing room', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { roomId: validRoomId });
    
    expect(response.result).toBeDefined();
    expect(response.result?.success).toBe(true);
  });

  it('should fail when joining a non-existent room', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { roomId: 'INVALID' });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Room not found');
  });

  it('should fail when room ID is empty', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { roomId: '' });
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
    expect(response.error?.message).toBe('Room ID is required');
  });

  it('should fail when room ID is missing', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', {});
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
    expect(response.error?.message).toBe('Room ID is required');
  });

  it('should fail when room ID is not a string', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { roomId: 123 });
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
  });
});
