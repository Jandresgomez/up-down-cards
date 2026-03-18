export interface ResponsiveSizes {
  width: number;
  height: number;
  padding: number;
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

const MOBILE_PADDING = 8;
const DESKTOP_PADDING = 12;

export function getResponsiveSizes(): ResponsiveSizes {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768;

  return {
    width,
    height,
    padding: isMobile ? MOBILE_PADDING : DESKTOP_PADDING,
    isMobile,
    titleSize: isMobile ? 32 : 40,
    subtitleSize: isMobile ? 24 : 28,
    fontSize: isMobile ? 20 : 24,
    smallFontSize: isMobile ? 18 : 20,
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
    spacing: isMobile ? MOBILE_PADDING * 2 : DESKTOP_PADDING * 2,
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
  const cardHeight = Math.floor(window.innerHeight * 0.08);
  const cardWidth = Math.floor(cardHeight * 0.80);
  return {
    width: cardWidth,
    height: cardHeight,
    margin: mobile ? 4 : 5,
  };
};

export const getPlayedCardDimensions = () => {
  const sizes = getResponsiveSizes();
  const normalCardDims = getCardDimensions();
  const cardHeight = normalCardDims.height + 2 * sizes.padding;
  const cardWidth = normalCardDims.width + sizes.padding;
  return {
    width: cardWidth,
    height: cardHeight,
    margin: sizes.isMobile ? 4 : 5,
  };
};

// Mesa card dimensions — wider than normal cards to fit rank+suit side by side, slightly shorter than normal cards
export const getMesaCardDimensions = () => {
  const normalCard = getCardDimensions();
  const height = Math.floor(normalCard.width * 0.80); // slightly shorter than a normal card
  const width = Math.floor(normalCard.height * 1);              // wider than tall, fits rank+suit side by side
  return { width, height };
};