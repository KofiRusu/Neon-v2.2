/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    "../../packages/core-agents/**/*.{js,ts,jsx,tsx}",
    "../../packages/types/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          400: "#00D4FF",
          500: "#0AB8E6",
          600: "#0891B2",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neon color palette
        neon: {
          300: "#66E9FF",
          400: "#00D4FF",
          500: "#0AB8E6",
          600: "#0891B2",
        },
        "neon-blue": "#00D4FF",
        "neon-purple": "#B084FF",
        "neon-pink": "#FF006B",
        "neon-green": "#00FF88",
        "neon-yellow": "#FFD700",
        "neon-orange": "#FF4500",
        "neon-cyan": "#00FFFF",
        // Dark color palette - Add all missing shades
        dark: {
          300: "#64748B", // Light gray text
          400: "#475569", // Medium gray text
          500: "#334155", // Status indicators
          600: "#1E293B", // Borders and dividers
          700: "#0F172A", // Surfaces and containers
          800: "#020617", // Cards and panels
          900: "#0A0A0F", // Main background
        },
        "dark-bg": "#0A0A0F",
        "dark-surface": "#1A1B23",
        "dark-border": "#2A2B35",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)" },
        },
        "pulse-neon": {
          "0%": {
            boxShadow: "0 0 5px #00D4FF, 0 0 10px #00D4FF, 0 0 15px #00D4FF",
          },
          "50%": {
            boxShadow: "0 0 10px #00D4FF, 0 0 20px #00D4FF, 0 0 30px #00D4FF",
          },
          "100%": {
            boxShadow: "0 0 5px #00D4FF, 0 0 10px #00D4FF, 0 0 15px #00D4FF",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "neon-gradient": "linear-gradient(45deg, #00D4FF, #B084FF, #FF006B)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
