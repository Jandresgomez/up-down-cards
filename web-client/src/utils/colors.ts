// ─── Backgrounds ─────────────────────────────────────────────────────────────
export const BG_SCENE = 0x1a1a2e; // dark navy — primary scene/app background
export const BG_TABLE = 0x0f3d3e; // dark teal — playing table surface
export const BG_PANEL = 0x1a1a2e; // alias: overlay/modal panels (same as BG_SCENE)
export const BG_PLAYER_ACTIVE = 0x4caf50; // green — current player indicator bg
export const BG_PLAYER_IDLE = 0x2a2a3e; // dark blue-gray — inactive player indicator bg
export const BG_ROW = 0x252545; // dark purple-gray — list row background (MockPicker)
export const BG_ICON_BTN = 0x444466; // gray-purple — small icon button background
export const BG_OVERLAY = 0x000000; // black — overlay tint (use with alpha)

// ─── Brand / Primary ─────────────────────────────────────────────────────────
export const TEAL = 0x2a9d8f; // primary teal — buttons, accents, borders
export const TEAL_CSS = '#2a9d8f'; // CSS string version for DOM elements

// ─── Text ─────────────────────────────────────────────────────────────────────
export const TEXT_PRIMARY = 0xffffff; // white — primary text
export const TEXT_SECONDARY = 0xaaaaaa; // light gray — secondary/muted text
export const TEXT_LIGHT = 0xcccccc; // lighter gray — player name display etc.
export const TEXT_DARK = 0x000000; // black — text on light backgrounds (cards)

// ─── State / Semantic ─────────────────────────────────────────────────────────
export const SUCCESS = 0x4caf50; // green — wins, confirmations, positive scores
export const SUCCESS_CSS = '#27ae60'; // CSS string — success feedback on DOM buttons
export const WARNING = 0xffff00; // yellow — "your turn" attention text
export const ERROR = 0xff0000; // red — error text, red suits (hearts/diamonds)
export const ERROR_LIGHT = 0xff4444; // lighter red — error text (welcome screen)
export const ERROR_SOFT = 0xff6b6b; // soft red — negative scores, warnings

// ─── Card ─────────────────────────────────────────────────────────────────────
export const CARD_BG = 0xffffff; // white — card face background
export const CARD_BORDER = 0x333333; // dark gray — default card border
export const CARD_HIGHLIGHT = 0x11ABD6; // cyan — selected/highlighted card border
export const CARD_WINNER = 0xffd700; // gold — winning card border and stars
export const CARD_ERROR = 0xff0000; // red — invalid card highlight border

// ─── Accent / Highlight ──────────────────────────────────────────────────────
export const GOLD = 0xffd700; // gold — 1st place, winner highlights, premium
export const STROKE_ACTIVE = 0x66ff66; // bright green — current player border stroke
export const STROKE_IDLE = 0x4a4a5e; // dark gray-purple — inactive player border

// ─── Ranking (podium) ────────────────────────────────────────────────────────
export const RANK_1ST = 0xffd700; // gold
export const RANK_2ND = 0xc0c0c0; // silver
export const RANK_3RD = 0xcd7f32; // bronze

// ─── Round Result ────────────────────────────────────────────────────────────
export const DELIVERED = 0x4caf50; // green — player delivered their bet
export const FAILED = 0xff6b6b; // soft red — player failed their bet
export const SCORE_POSITIVE = 0x6fdc8c; // light green — positive score diff
export const SCORE_ZERO = 0xff6b6b; // soft red — zero score diff (failed)
export const ROW_HIGHLIGHT = 0x2a2a4e; // subtle highlight for alternating rows

// ─── Disabled / Inactive ─────────────────────────────────────────────────────
export const DISABLED = 0x666666; // medium gray — disabled buttons, waiting borders
export const MUTED = 0x888888; // gray — muted/secondary elements

// ─── One-off UI ──────────────────────────────────────────────────────────────
export const BTN_PLAYING = 0x457b9d; // slate blue — "playing" mode button (MockPicker)
export const TABLE_BORDER = 0x2a9d8f; // teal — playing table border (alias of TEAL)

// ─── PLAYER_COLORS ──────────────────────────────────────────────────────────────
export const PLAYER_COLORS = [
    0x8a3ffc,
    0x6fdc8c,
    0xd2a106,
    0xba4e00,
    0x33b1ff,
    0xfa4d56,
    0xd4bbff,
    0x002d9c,
    0xbae6ff,
    0x007d79,
]