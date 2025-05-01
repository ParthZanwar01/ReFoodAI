/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// ReFood AI Primary Palette
const brandPrimary = '#3DBA6F'; // Evergreen
const accent = '#F2B441'; // Harvest Gold
const ink = '#001E2B'; // Midnight

// ReFood AI Neutrals
const cloud = '#F9FAFB';
const mist = '#E2E8F0';
const steel = '#64748B';

export const Colors = {
  light: {
    text: ink,
    background: cloud,
    tint: brandPrimary,
    icon: steel,
    tabIconDefault: steel,
    tabIconSelected: brandPrimary,
    // Add other colors as needed for light mode
    accent: accent,
    mist: mist,
    steel: steel,
    ink: ink
  },
  dark: {
    text: cloud,
    background: ink,
    tint: brandPrimary,
    icon: mist,
    tabIconDefault: mist,
    tabIconSelected: brandPrimary,
     // Add other colors as needed for dark mode (adjusting for contrast)
    accent: accent, // Accent might remain the same or be adjusted slightly
    mist: mist,
    steel: steel,
    ink: ink // Ink might be used for borders or other elements
  },
};

// Exporting colors directly for easier access in styling
export { brandPrimary, accent, ink, cloud, mist, steel };
