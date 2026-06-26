import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { useSettingsStore } from '@/stores/settingsStore';

export interface ActiveTheme {
  isDark: boolean;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
}

/** Read the resolved theme (light/dark) and its color tokens. */
export function useTheme(): ActiveTheme {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    isDark,
    scheme: isDark ? 'dark' : 'light',
    colors: isDark ? darkColors : lightColors,
  };
}

/**
 * Keep NativeWind's color scheme in sync with the user's saved preference.
 * Mount once near the app root.
 */
export function useSyncTheme(): void {
  const pref = useSettingsStore((s) => s.theme);
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    setColorScheme(pref);
  }, [pref, setColorScheme]);
}
