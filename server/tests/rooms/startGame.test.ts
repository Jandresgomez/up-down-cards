import { callFunction, CreateRoomResponse, JoinRoomResponse, StartGameResponse } from '../helpers';

describe('startGame', () => {
  let validRoomId: string;
  const adminPlayerId = 'admin-player-123';
  const player2Id = 'player-456';
  const player3Id = 'player-789';

  beforeEach(async () => {
    const response = await callFunction<CreateRoomResponse>('createRoom', { playerId: adminPlayerId });
    validRoomId = response.result!.roomId;
  });

  it('should allow admin to start game with 2+ players', async () => {
    // Add second player
    await callFunction<JoinRoomResponse>('joinRoom', {
      roomId: validRoomId,
      playerId: player2Id
    });

    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId,
      playerId: adminPlayerId
    });
    
    expect(response.result?.success).toBe(true);
  });

  it('should fail when only 1 player in room', async () => {
    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId,
      playerId: adminPlayerId
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Need at least 2 players to start');
  });

  it('should fail when non-admin tries to start game', async () => {
    // Add second player
    await callFunction<JoinRoomResponse>('joinRoom', {
      roomId: validRoomId,
      playerId: player2Id
    });

    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId,
      playerId: player2Id
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Only admin can start the game');
  });

  it('should fail when room does not exist', async () => {
    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: 'FAKE99',
      playerId: adminPlayerId
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Room not found');
  });

  it('should fail when roomId is missing', async () => {
    const response = await callFunction<StartGameResponse>('startGame', {
      playerId: adminPlayerId
    });
    
    expect(response.error).toBeDefined();
  });

  it('should fail when playerId is missing', async () => {
    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId
    });
    
    expect(response.error).toBeDefined();
  });

  it('should fail when trying to start game twice', async () => {
    // Add second player
    await callFunction<JoinRoomResponse>('joinRoom', {
      roomId: validRoomId,
      playerId: player2Id
    });

    // Start game first time
    await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId,
      playerId: adminPlayerId
    });

    // Try to start again
    const response = await callFunction<StartGameResponse>('startGame', {
      roomId: validRoomId,
      playerId: adminPlayerId
    });
    
    expect(response.result?.success).toBe(false);
    expect(response.result?.error).toBe('Game already started');
  });
});
