/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#111111',
        'teal': '#333333',
        'light-grey': '#F9F9F9',
        'soft-orange': '#666666'
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
