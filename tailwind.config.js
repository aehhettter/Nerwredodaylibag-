/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'neutral-850': '#212121',
        'neutral-950': '#0a0a0a',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
