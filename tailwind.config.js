/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D3748',
          light: '#4A5568',
          dark: '#1A202C',
        },
        secondary: {
          DEFAULT: '#48BB78',
          light: '#68D391',
          dark: '#2F855A',
        },
        error: {
          DEFAULT: '#F56565',
          light: '#FC8181',
          dark: '#E53E3E',
        },
      },
    },
  },
  plugins: [],
} 