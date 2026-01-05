/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shot: {
          light: '#86efac',
          DEFAULT: '#22c55e',
          dark: '#166534',
        },
        read: {
          light: '#93c5fd',
          DEFAULT: '#3b82f6',
          dark: '#1e40af',
        },
        mental: {
          light: '#d8b4fe',
          DEFAULT: '#a855f7',
          dark: '#6b21a8',
        },
        common: '#9ca3af',
        uncommon: '#60a5fa',
        rare: '#fbbf24',
        special: '#c084fc',
        confidence: '#facc15',
        health: '#ef4444',
        safe: '#22d3ee',
      },
    },
  },
  plugins: [],
}
