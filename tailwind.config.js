/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        canvas: "#F2F4F6",
        surface: "#FFFFFF",
        surfaceAlt: "#FAFBFC",
        surfaceSunken: "#EBEEF1",
        line: {
          DEFAULT: "#E1E6EC",
          strong: "#CBD3DC",
          faint: "#EDF0F4",
        },
        ink: {
          950: "#071014",
          900: "#0B151A",
          800: "#101F26",
          700: "#162933",
          600: "#1F3A47",
          500: "#2A4A58",
          400: "#52707F",
          300: "#7C95A3",
        },
        brand: {
          50: "#E8F4F4",
          100: "#C9E6E6",
          200: "#9BCDCE",
          300: "#6DB4B6",
          400: "#3F9B9E",
          500: "#0D5C63",
          600: "#0B4A50",
          700: "#093B40",
          800: "#072C30",
          900: "#051F22",
        },
        ember: {
          50: "#FDF3EC",
          500: "#C2410C",
          600: "#9A340A",
        },
        safe: "#15803D",
        caution: "#B45309",
        risk: "#B91C1C",
        idle: "#475569",
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11,21,26,0.04), 0 1px 3px rgba(11,21,26,0.06)",
        panelMd: "0 2px 8px rgba(11,21,26,0.06), 0 1px 2px rgba(11,21,26,0.04)",
        float: "0 8px 24px rgba(11,21,26,0.10), 0 2px 6px rgba(11,21,26,0.06)",
        insetLine: "inset 0 -1px 0 rgba(11,21,26,0.04)",
        glow: "0 0 0 3px rgba(13,92,99,0.12)",
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, rgba(11,21,26,0.045) 1px, transparent 1px)",
        "dot-grid-light":
          "radial-gradient(circle, rgba(13,92,99,0.06) 1px, transparent 1px)",
        "teal-veil":
          "linear-gradient(135deg, rgba(13,92,99,0.04) 0%, rgba(194,65,12,0.02) 100%)",
      },
      backgroundSize: {
        "grid-sm": "16px 16px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scan-flash": {
          "0%": { backgroundColor: "rgba(13,92,99,0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
        "pulse-risk": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(185,28,28,0.35)" },
          "50%": { boxShadow: "0 0 0 4px rgba(185,28,28,0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.3s ease both",
        "scan-flash": "scan-flash 0.9s ease-out",
        "pulse-risk": "pulse-risk 2s ease-in-out infinite",
        "slide-in": "slide-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
