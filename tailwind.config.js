/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // רקעים
        'bg-light': '#F7FAFC',      // gray.50 - רקע הדף הראשי
        'bg-card': '#FFFFFF',        // white - כרטיסים ורכיבים
        
        // צבעי המותג (כחול)
        'brand': {
          DEFAULT: '#0967D2',        // brand.500 - כחול עיקרי
          light: '#E6F6FF',          // brand.50
          dark: '#0552B5',           // brand.600 - כחול כהה יותר
        },
        
        // טקסט
        'text-primary': '#1A202C',   // gray.800 - כותרות
        'text-body': '#2D3748',      // gray.700 - טקסט רגיל
        'text-secondary': '#4A5568', // gray.600 - טקסט משני
        'text-muted': '#718096',     // gray.500
        
        // Legacy (תאימות לאחור)
        'accent-teal': '#0967D2',    // עכשיו כחול במקום תכלת
        'accent-hover': '#0552B5',   // עכשיו כחול כהה
      },
    },
  },
  plugins: [],
}
