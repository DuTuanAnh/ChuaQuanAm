/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'brown-darker': '#2C1A0E',
        'brown-deep': '#3D2B1F',
        'brown-mid': '#5A4030',
        'brown-soft': '#7A5A45',
        brass: '#B8860B',
        'brass-bright': '#D4A843',
        'brass-light': '#D4A82A',
        'brass-soft': '#E8C870',
        parchment: '#C4A47C',
        cream: '#FDF8EF',
        'cream-warm': '#F2E6CC',
        ink: '#1F140C',
        muted: '#8B7B6A',
        line: '#D9CCB6',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 40px -28px rgba(61, 43, 31, 0.25)',
        deep: '0 30px 60px -30px rgba(61, 43, 31, 0.35)',
      },
    },
  },
  plugins: [],
};
