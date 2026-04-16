/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f8b133',
          dark: '#df9e2d',
        },
        secondary: '#fdf6e7',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: {
          main: '#1E293B',
          muted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
