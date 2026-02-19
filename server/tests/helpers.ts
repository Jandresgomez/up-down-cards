const BASE_URL = 'http://127.0.0.1:5001/up-down-cards/us-central1';

export interface CreateRoomResponse {
  result?: {
    roomId: string;
    success: boolean;
  };
  error?: {
    message: string;
    status: string;
  };
}

export interface JoinRoomResponse {
  result?: {
    success: boolean;
    error?: string;
  };
  error?: {
    message: string;
    status: string;
  };
}

export async function callFunction<T>(functionName: string, data: any = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  
  const json: any = await response.json();
  
  // onCall functions return { result: ... } on success or { error: ... } on error
  if (json.result !== undefined) {
    return { result: json.result } as T;
  } else if (json.error) {
    return { error: json.error } as T;
  }
  
  return json as T;
}
