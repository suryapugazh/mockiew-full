/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#6366F1',
          light: '#EEF2FF',
        },
      },
      boxShadow: {
        'enterprise': '0 1px 3px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}
