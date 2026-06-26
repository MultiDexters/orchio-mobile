/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Calm, minimal palette. Semantic tokens are resolved at runtime
        // via the theme module; these are convenience aliases for NativeWind.
        ink: {
          DEFAULT: '#0B0F14',
          soft: '#11171F',
          card: '#161D27',
        },
        paper: {
          DEFAULT: '#F6F7F9',
          soft: '#FFFFFF',
          card: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#5B8DEF',
          soft: '#7FA8F5',
          deep: '#3A6FD8',
        },
        calm: {
          mint: '#3FBF9F',
          amber: '#F2B441',
          rose: '#E8657A',
          violet: '#9B8CFF',
        },
      },
      borderRadius: {
        xl: '18px',
        '2xl': '24px',
        '3xl': '30px',
      },
    },
  },
  plugins: [],
};
