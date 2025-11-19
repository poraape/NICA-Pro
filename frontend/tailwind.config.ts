import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0a84ff",
          dark: "#0060df"
        }
      },
      fontFamily: {
        sans: ["SF Pro Display", "SF Pro Text", "-apple-system", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
