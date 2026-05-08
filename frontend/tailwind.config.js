/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SegrePay eco-friendly color palette from roadmap
        'segre-bg': '#f5f2eb',
        'segre-bg-2': '#ede9df',
        'segre-ink': '#1a1a12',
        'segre-ink-2': '#4a4a38',
        'segre-ink-3': '#7a7a60',
        'segre-green': '#2d6a4f',
        'segre-green-lt': '#52b788',
        'segre-green-bg': '#d8f3dc',
        'segre-amber': '#b5510a',
        'segre-amber-bg': '#fde8cc',
        'segre-blue': '#1d4e89',
        'segre-blue-bg': '#dbeafe',
        'segre-red': '#9b2226',
        'segre-red-bg': '#ffe4e4',
        'segre-card': '#fff9ef',
        'segre-rule': 'rgba(26,26,18,0.12)',
      },
      fontFamily: {
        'serif': ['"Instrument Serif"', 'serif'],
        'sans': ['Outfit', 'sans-serif'],
        'mono': ['"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        'segre': '0 2px 16px rgba(26,26,18,0.08)',
      },
    },
  },
  plugins: [],
}
