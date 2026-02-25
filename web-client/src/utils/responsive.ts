export interface ResponsiveSizes {
  width: number;
  height: number;
  isMobile: boolean;
  titleSize: number;
  subtitleSize: number;
  fontSize: number;
  smallFontSize: number;
  buttonSmall: { width: number; height: number };
  buttonMedium: { width: number; height: number };
  buttonLarge: { width: number; height: number };
  inputWidth: number;
  inputHeight: number;
  spacing: number;
  smallSpacing: number;
}

export function getResponsiveSizes(): ResponsiveSizes {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768;
  
  return {
    width,
    height,
    isMobile,
    titleSize: isMobile ? 32 : 48,
    subtitleSize: isMobile ? 20 : 28,
    fontSize: isMobile ? 18 : 24,
    smallFontSize: isMobile ? 14 : 18,
    buttonSmall: {
      width: isMobile ? 50 : 60,
      height: isMobile ? 50 : 60,
    },
    buttonMedium: {
      width: Math.min(200, width * 0.6),
      height: isMobile ? 45 : 50,
    },
    buttonLarge: {
      width: Math.min(300, width * 0.8),
      height: isMobile ? 50 : 60,
    },
    inputWidth: Math.min(300, width * 0.8),
    inputHeight: isMobile ? 45 : 50,
    spacing: isMobile ? 25 : 40,
    smallSpacing: isMobile ? 15 : 20,
  };
}

// Viewport units (legacy support for GameScreen)
export const vw = (percent: number) => (window.innerWidth * percent) / 100;
export const vh = (percent: number) => (window.innerHeight * percent) / 100;
export const vmin = (percent: number) => (Math.min(window.innerWidth, window.innerHeight) * percent) / 100;

// Mobile detection
export const isMobile = () => window.innerWidth < 768;

// Responsive card dimensions
export const getCardDimensions = () => {
  const mobile = isMobile();
  return {
    width: mobile ? 60 : 80,
    height: mobile ? 84 : 112,
    fontSize: mobile ? 16 : 20,
    margin: mobile ? 4 : 8,
  };
};

// Layout helper (legacy support for GameScreen)
export const LAYOUT = {
  getHeaderArea: () => ({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: vh(10),
  }),
  getBoardArea: () => ({
    x: 0,
    y: vh(10),
    width: window.innerWidth,
    height: isMobile() ? vh(55) : vh(60), // More space for hand on mobile
  }),
  getHandArea: () => ({
    x: 0,
    y: isMobile() ? vh(65) : vh(70),
    width: window.innerWidth,
    height: isMobile() ? vh(35) : vh(30), // Larger hand area on mobile
  }),
};
