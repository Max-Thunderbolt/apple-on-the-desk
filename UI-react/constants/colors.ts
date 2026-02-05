// Color palette: ink-black background, white text, fresh-sky CTA, sea-green & intense-cherry for visuals
export const colorPalette = {
  white: '#ffffffff',
  inkBlack: '#00171fff',
  seaGreen: '#1a936fff',
  intenseCherry: '#c5283dff',
  freshSky: '#00a8e8ff',
};

// Gradient combinations for class cards using the new palette (sea-green, intense-cherry, fresh-sky)
export const gradients = [
  { start: colorPalette.freshSky, end: colorPalette.seaGreen },
  { start: colorPalette.intenseCherry, end: colorPalette.freshSky },
  { start: colorPalette.seaGreen, end: colorPalette.intenseCherry },
  { start: colorPalette.freshSky, end: colorPalette.inkBlack },
  { start: colorPalette.intenseCherry, end: colorPalette.seaGreen },
  { start: colorPalette.seaGreen, end: colorPalette.freshSky },
  { start: colorPalette.freshSky, end: colorPalette.intenseCherry },
  { start: colorPalette.seaGreen, end: colorPalette.inkBlack },
];

// Theme: background = ink-black, text = white, CTA/emphasis = fresh-sky, visuals = sea-green & intense-cherry
const themeColors = {
  primary: colorPalette.freshSky,       // Call to action / emphasis
  secondary: colorPalette.seaGreen,     // Visual enhancement
  accent: colorPalette.intenseCherry,    // Visual enhancement
  background: colorPalette.inkBlack,
  surface: 'rgba(26, 147, 111, 0.12)',  // sea-green tint for cards
  text: colorPalette.white,
  textLight: 'rgba(255, 255, 255, 0.85)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  white: colorPalette.white,
  black: colorPalette.inkBlack,
  success: colorPalette.seaGreen,
  warning: colorPalette.intenseCherry,
  error: colorPalette.intenseCherry,
  info: colorPalette.freshSky,
  border: 'rgba(255, 255, 255, 0.15)',
  cardBackground: 'rgba(0, 23, 31, 0.95)',
};

// Hook to get theme-aware colors (always dark theme with new palette)
export const useColors = () => themeColors;

// Default export for backward compatibility
export const colors = themeColors;

// Export individual palette for convenience
export const {
  white,
  inkBlack,
  seaGreen,
  intenseCherry,
  freshSky,
} = colorPalette;
