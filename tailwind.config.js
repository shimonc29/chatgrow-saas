/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-light': '#F8F9FA',
        'bg-card': '#FFFFFF',
        'accent-teal': '#00798C',
        'accent-hover': '#035368',
        'text-primary': '#212529',
        'text-secondary': '#6C757D',
      },
    },
  },
  plugins: [],
}
