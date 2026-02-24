// Responsive utility functions for PixiJS
export function vw(percent: number): number {
  return (window.innerWidth * percent) / 100;
}

export function vh(percent: number): number {
  return (window.innerHeight * percent) / 100;
}

export function vmin(percent: number): number {
  return (Math.min(window.innerWidth, window.innerHeight) * percent) / 100;
}

export function vmax(percent: number): number {
  return (Math.max(window.innerWidth, window.innerHeight) * percent) / 100;
}

// Layout constants for game areas
export const LAYOUT = {
  HEADER_HEIGHT: 15,      // 15% of viewport height
  HAND_HEIGHT: 25,        // 25% of viewport height
  BOARD_HEIGHT: 60,       // 60% of viewport height (remaining space)

  // Helper functions
  getHeaderArea() {
    return {
      y: 0,
      height: vh(this.HEADER_HEIGHT)
    };
  },

  getBoardArea() {
    return {
      y: vh(this.HEADER_HEIGHT),
      height: vh(this.BOARD_HEIGHT)
    };
  },

  getHandArea() {
    return {
      y: vh(this.HEADER_HEIGHT + this.BOARD_HEIGHT),
      height: vh(this.HAND_HEIGHT)
    };
  }
};
