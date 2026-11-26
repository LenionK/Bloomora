// Colours are named by what they are for, not by how they look, so a dark
// theme can give each role its own value.
export const colors = {
  background: '#F6F5F3',
  // Cards, popups and bars on the background.
  surface: '#FFFFFF',
  // Text and icons drawn on a filled colour, such as the primary or an activity.
  onColor: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  text: '#1D1B20',
  textSecondary: '#6B6870',

  primary: '#B5305E',
  // A light tint behind primary text, such as a selected day or a back button.
  primaryContainer: '#F7E3EA',
  // Ring and bar tracks on the background.
  primaryTrack: '#F1CEDB',
  // Lighter and darker marks drawn on the primary colour.
  onPrimaryMuted: '#E9A1BA',
  onPrimaryStrong: '#8E2149',

  streak: '#B9520B',
  // Streak text on its container: darker than the flame, so small text stays readable.
  streakText: '#A84A08',
  // A day with water recorded: filled, or only a ring when nothing was recorded.
  streakUntracked: '#BF7A4A',
  streakContainer: '#FDEEE3',

  water: '#1F6FB5',
  waterDark: '#0E4C8A',
  waterMuted: '#5E93CC',
  waterContainer: '#E3EEF8',
  waterTrack: '#CFE1F2',

  // The dot of a chart day with nothing to show.
  chartEmpty: '#8E8A93',

  // A hairline around raised surfaces, drawn before any shadow.
  border: 'rgba(29, 27, 32, 0.08)',
  // The confirm button of an action that deletes or resets data.
  danger: '#B3261E',
};

// Cards and bars stand apart from the page with a hairline first, and a soft
// shadow below it that stays under 8% opacity.
export const cardShadow = {
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
};

// The text sizes of the app. 12 is the smallest, for labels and notes only;
// lists and values use 14 or 16.
export const fontSizes = {
  caption: 12,
  label: 14,
  body: 16,
  subtitle: 18,
  title: 20,
  headline: 26,
  large: 34,
  display: 40,
};

// Spaces between and inside elements, in steps of 4.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  small: 6,
  chip: 16,
  card: 24,
};

// Animation lengths, in milliseconds. Longer ambient loops, such as the waves
// of the bottle, are a documented exception and stop with reduced motion.
export const durations = {
  instant: 100,
  fast: 150,
  base: 200,
  slow: 300,
};

// Room above the first line of every screen.
export const SCREEN_TOP = 48;
// The smallest side Android suggests for something to tap.
export const MIN_TOUCH_SIZE = 48;

// Darker than the first orange, #C2570C, so white text on it has some margin.
const ORANGE = '#B9520B';

// Colours that were replaced, and the one that takes their place in saved activities.
export const replacedColors: Record<string, string> = {
  '#C2570C': ORANGE,
};

export const activityColors = [
  { name: 'Pink', value: colors.primary },
  { name: 'Orange', value: ORANGE },
  { name: 'Yellow', value: '#966F00' },
  { name: 'Green', value: '#2E7D32' },
  { name: 'Teal', value: '#0B7285' },
  { name: 'Blue', value: '#3559C7' },
  { name: 'Purple', value: '#7B3FB5' },
];
