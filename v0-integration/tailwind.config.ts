import type { Config } from "tailwindcss"
import defaultConfig from "shadcn/ui/tailwind.config"

const config: Config = {
  ...defaultConfig,
  content: [
    ...defaultConfig.content,
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        "space-gray": "#0e0f1a",
        "space-purple": "#1a1b2e",
        "neon-blue": "#00ffff",
        "neon-purple": "#7a5fff",
        "neon-pink": "#ff1493",
        "neon-green": "#39ff14",
      },
      boxShadow: {
        "neon-blue": "0 0 20px rgba(0, 255, 255, 0.3)",
        "neon-purple": "0 0 20px rgba(122, 95, 255, 0.3)",
        "neon-pink": "0 0 20px rgba(255, 20, 147, 0.3)",
        "neon-green": "0 0 20px rgba(57, 255, 20, 0.3)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}

export default config
