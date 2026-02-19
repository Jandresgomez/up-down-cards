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
