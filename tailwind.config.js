/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f9fafb",
        foreground: "#111",
        muted: "#6b7280"
      }
    }
  },
  plugins: []
};

