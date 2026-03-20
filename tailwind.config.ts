/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The core mainframe colors
        background: '#070A10', // Deepest dark blue/black
        surface: '#111520',    // Slightly lighter card background
        
        // Cyberpunk Accents
        primary: '#00F0FF',    // Neon Cyan
        secondary: '#B026FF',  // Neon Purple
        hacker: '#00FF41',     // Matrix Green (for success/terminals)
        warning: '#FF3366',    // Neon Pink/Red (for errors/boss fights)
        
        // Text Colors
        maintext: '#E2E8F0',
        subtext: '#8B9BB4',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(to right bottom, rgba(0, 240, 255, 0.1), rgba(176, 38, 255, 0.1))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}