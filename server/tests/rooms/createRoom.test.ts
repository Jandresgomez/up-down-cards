import { callFunction, CreateRoomResponse } from '../helpers';

describe('createRoom', () => {
  const testPlayerId = 'test-player-123';

  it('should create a new room with a valid room ID', async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', { playerId: testPlayerId });
    
    expect(response.result).toBeDefined();
    expect(response.result?.success).toBe(true);
    expect(response.result?.roomId).toBeDefined();
    expect(response.result?.roomId).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should create unique room IDs', async () => {
    const response1 = await callFunction<CreateRoomResponse>('createRoom', { playerId: testPlayerId });
    const response2 = await callFunction<CreateRoomResponse>('createRoom', { playerId: testPlayerId });
    
    expect(response1.result?.roomId).not.toBe(response2.result?.roomId);
  });

  it('should return success flag as true', async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', { playerId: testPlayerId });
    
    expect(response.result?.success).toBe(true);
  });

  it('should fail when playerId is missing', async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', {});
    
    expect(response.error).toBeDefined();
  });
});
