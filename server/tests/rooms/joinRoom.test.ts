import { callFunction, CreateRoomResponse, JoinRoomResponse } from '../helpers';

describe('joinRoom', () => {
  let validRoomId: string;
  const testPlayerId = 'test-player-123';
  const joiningPlayerId = 'test-player-456';

  beforeEach(async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', { playerId: testPlayerId });
    validRoomId = response.result!.roomId;
  });

  it('should successfully join an existing room', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: validRoomId,
      playerId: joiningPlayerId
    });
    
    expect(response.result).toBeDefined();
    expect(response.result?.success).toBe(true);
  });

  it('should fail when joining a non-existent room', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: 'INVALID',
      playerId: joiningPlayerId
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Room not found');
  });

  it('should fail when room ID is empty', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: '',
      playerId: joiningPlayerId
    });
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
    expect(response.error?.message).toBe('Room ID is required');
  });

  it('should fail when room ID is missing', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { 
      playerId: joiningPlayerId
    });
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
    expect(response.error?.message).toBe('Room ID is required');
  });

  it('should fail when playerId is missing', async () => {
    const response = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: validRoomId
    });
    
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe('INVALID_ARGUMENT');
    expect(response.error?.message).toBe('Player ID is required');
  });

  it('should allow same player to join twice (idempotent)', async () => {
    const response1 = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: validRoomId,
      playerId: joiningPlayerId
    });
    const response2 = await callFunction<JoinRoomResponse>('joinRoom', { 
      roomId: validRoomId,
      playerId: joiningPlayerId
    });
    
    expect(response1.result?.success).toBe(true);
    expect(response2.result?.success).toBe(true);
  });
});
