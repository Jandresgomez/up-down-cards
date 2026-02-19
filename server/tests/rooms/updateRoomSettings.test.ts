import { callFunction, CreateRoomResponse, UpdateRoomSettingsResponse } from '../helpers';

describe('updateRoomSettings', () => {
  let validRoomId: string;
  const adminPlayerId = 'admin-player-123';
  const regularPlayerId = 'regular-player-456';

  beforeEach(async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', { playerId: adminPlayerId });
    validRoomId = response.result!.roomId;
  });

  it('should allow admin to update number of rounds', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      roomId: validRoomId,
      playerId: adminPlayerId,
      numberOfRounds: 5
    });
    
    expect(response.result?.success).toBe(true);
  });

  it('should allow admin to update max players', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      roomId: validRoomId,
      playerId: adminPlayerId,
      maxPlayers: 6
    });
    
    expect(response.result?.success).toBe(true);
  });

  it('should fail when non-admin tries to update settings', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      roomId: validRoomId,
      playerId: regularPlayerId,
      numberOfRounds: 5
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Only admin can update settings');
  });

  it('should fail when room does not exist', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      roomId: 'FAKE99',
      playerId: adminPlayerId,
      numberOfRounds: 5
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Room not found');
  });

  it('should fail when roomId is missing', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      playerId: adminPlayerId,
      numberOfRounds: 5
    });
    
    expect(response.error).toBeDefined();
  });

  it('should fail when playerId is missing', async () => {
    const response = await callFunction<UpdateRoomSettingsResponse>('updateRoomSettings', {
      roomId: validRoomId,
      numberOfRounds: 5
    });
    
    expect(response.error).toBeDefined();
  });
});
