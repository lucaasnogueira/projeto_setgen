import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-bg))",
          hover: "hsl(var(--sidebar-bg-hover))",
          border: "hsl(var(--sidebar-border))",
          fg: "hsl(var(--sidebar-fg))",
          "fg-muted": "hsl(var(--sidebar-fg-muted))",
          "fg-dim": "hsl(var(--sidebar-fg-dim))",
        },
        "text-secondary": "hsl(var(--text-secondary))",
        "text-muted": "hsl(var(--text-muted))",
        status: {
          "green-bg": "hsl(var(--status-green-bg))",
          "green-fg": "hsl(var(--status-green-fg))",
          "blue-bg": "hsl(var(--status-blue-bg))",
          "blue-fg": "hsl(var(--status-blue-fg))",
          "amber-bg": "hsl(var(--status-amber-bg))",
          "amber-fg": "hsl(var(--status-amber-fg))",
          "red-bg": "hsl(var(--status-red-bg))",
          "red-fg": "hsl(var(--status-red-fg))",
          "purple-bg": "hsl(var(--status-purple-bg))",
          "purple-fg": "hsl(var(--status-purple-fg))",
          "gray-bg": "hsl(var(--status-gray-bg))",
          "gray-fg": "hsl(var(--status-gray-fg))",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "var(--radius-sm)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
