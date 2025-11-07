/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-navy': '#0D1117',
        'card-navy': '#161B22',
        'accent-copper': '#B87333',
        'action-blue': '#3A7CA5',
        'text-light': '#C9D1D9',
        'text-subtle': '#8B949E',
      },
    },
  },
  plugins: [],
}
