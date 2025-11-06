import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
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
        // New warm vintage color palette
        "terracotta-rose": "#B77466",
        "terracotta-orange": "#F59C5D",
        "ash-brown": "#957C62",
        "creamy-yellow": "#FFE1AF",
        "creamy-white": "#FFEFD4",
        "soft-beige": "#E2B59A",
        "deep-brown": "#4A3B2F",
        "dark-brown": "#3D2D25",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#B77466", // Terracotta Rose
          foreground: "#FFE1AF", // Creamy White
        },
        secondary: {
          DEFAULT: "#957C62", // Ash Brown
          foreground: "#FFE1AF", // Creamy White
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
      },
      fontFamily: {
        // Primary font families
        libre: ["Libre Baskerville", "serif"],
        varela: ["Varela Round", "sans-serif"],
        serif: ["Libre Baskerville", "Georgia", "Times New Roman", "serif"],
        sans: ["Varela Round", "system-ui", "sans-serif"],
      },
      fontSize: {
        "vintage-xs": ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.05em" }],
        "vintage-sm": ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.025em" }],
        "vintage-base": ["1rem", { lineHeight: "1.6", letterSpacing: "0.01em" }],
        "vintage-lg": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0.01em" }],
        "vintage-xl": ["1.25rem", { lineHeight: "1.5", letterSpacing: "0.005em" }],
        "vintage-2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "0.005em" }],
        "vintage-3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "0.01em" }],
        "vintage-4xl": ["2.25rem", { lineHeight: "1.2", letterSpacing: "0.01em" }],
        "vintage-5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "0.015em" }],
        "vintage-6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "0.02em" }],
        "vintage-7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "0.025em" }],
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
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
