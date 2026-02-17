export interface CreateRoomResponse {
  roomId: string;
  success: boolean;
}

export interface JoinRoomResponse {
  success: boolean;
  error?: string;
}

// Mock API calls - will be replaced with real server calls later
export async function createNewRoom(): Promise<CreateRoomResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock room ID
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return {
    roomId,
    success: true
  };
}

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock validation - for now just check if not blank
  // Later this will check against server
  if (!roomId || roomId.trim() === '') {
    return {
      success: false,
      error: 'Provided room ID is not valid'
    };
  }
  
  return {
    success: true
  };
}
