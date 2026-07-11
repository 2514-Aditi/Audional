/** @type {import('tailwindcss').Config} */
export default {
  // Support toggling dark mode via class on html tag
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Light Mode Palette
          bg: "#FFF3C8",
          card: "#FFFFFF",
          border: "#E6E6E6",
          primary: "#458393",
          secondary: "#34A99D",
          accent: "#E5CB90",
          text: "#1F2937",
          muted: "#6B7280",

          // Dark Mode Palette equivalents mapped for styling
          darkBg: "#111827",
          darkCard: "#1F2937",
          darkPrimary: "#34A99D",
          darkAccent: "#E5CB90",
          darkText: "#F9FAFB",
          darkMuted: "#9CA3AF",
          darkBorder: "#374151",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Roboto Slab', 'serif'],
      },
      borderRadius: {
        // Capped at exactly 8px as requested
        'lg': '8px',
        'md': '6px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
