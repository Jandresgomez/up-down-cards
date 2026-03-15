function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getPlayerId(): string {
  const cookieName = 'playerId';
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }

  // Generate new player ID
  const playerId = generatePlayerId();
  // Set cookie to expire in 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${cookieName}=${playerId}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;

  return playerId;
}

export function setCurrentRoomId(roomId: string): void {
  localStorage.setItem('currentRoomId', roomId);
}

export function getCurrentRoomId(): string | null {
  return localStorage.getItem('currentRoomId');
}

export function clearCurrentRoomId(): void {
  localStorage.removeItem('currentRoomId');
}

export function getPlayerName(): string | null {
  return localStorage.getItem('playerName');
}

export function setPlayerName(name: string): void {
  localStorage.setItem('playerName', name);
}

export function getPlayerShorthand(): string | null {
  return localStorage.getItem('playerShorthand');
}

export function setPlayerShorthand(shorthand: string): void {
  localStorage.setItem('playerShorthand', shorthand);
}

export function clearPlayerProfile(): void {
  localStorage.removeItem('playerName');
  localStorage.removeItem('playerShorthand');
}

export function generateShorthand(name: string): string {
  const trimmed = name.replace(/\s/g, '');
  if (trimmed.length === 0) return '';
  if (trimmed.length === 1) return (trimmed[0] + trimmed[0] + trimmed[0]).toUpperCase();
  if (trimmed.length === 2) return (trimmed[0] + trimmed[0] + trimmed[1]).toUpperCase();
  const mid = Math.floor(trimmed.length / 2);
  return (trimmed[0] + trimmed[mid] + trimmed[trimmed.length - 1]).toUpperCase();
}
