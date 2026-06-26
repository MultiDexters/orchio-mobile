/**
 * Runtime color tokens. NativeWind handles most styling via className,
 * but components that style imperatively (icons, status bar, gradients,
 * Reanimated colors) read from here so light/dark stay in one place.
 */

export interface ThemeColors {
  bg: string;
  bgSoft: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textFaint: string;
  brand: string;
  brandSoft: string;
  // voice state accents
  listening: string;
  speaking: string;
  thinking: string;
  armed: string;
  // semantic
  mint: string;
  amber: string;
  rose: string;
  violet: string;
  shadow: string;
}

export const darkColors: ThemeColors = {
  bg: '#0B0F14',
  bgSoft: '#11171F',
  card: '#161D27',
  cardBorder: '#222C39',
  text: '#EEF2F7',
  textMuted: '#9CA9B9',
  textFaint: '#5E6B7C',
  brand: '#5B8DEF',
  brandSoft: '#7FA8F5',
  listening: '#3FBF9F',
  speaking: '#F2B441',
  thinking: '#9B8CFF',
  armed: '#5E6B7C',
  mint: '#3FBF9F',
  amber: '#F2B441',
  rose: '#E8657A',
  violet: '#9B8CFF',
  shadow: '#000000',
};

export const lightColors: ThemeColors = {
  bg: '#F6F7F9',
  bgSoft: '#EEF1F5',
  card: '#FFFFFF',
  cardBorder: '#E6EAF0',
  text: '#0B0F14',
  textMuted: '#5A6573',
  textFaint: '#97A1AE',
  brand: '#3A6FD8',
  brandSoft: '#5B8DEF',
  listening: '#1FA98A',
  speaking: '#D69314',
  thinking: '#6E5BE0',
  armed: '#97A1AE',
  mint: '#1FA98A',
  amber: '#D69314',
  rose: '#D6475F',
  violet: '#6E5BE0',
  shadow: '#1B2330',
};
