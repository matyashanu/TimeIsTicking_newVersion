/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#2F4156',
        beige: '#fff0db',
      },
      fontFamily: {
        sans: ['Futura', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        bold: '700',
      },
    },
  },
  plugins: [],
};
