import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#E8DDCB",
        olive: "#556B2F",
        clay: "#B7794C"
      }
    }
  },
  plugins: []
};

export default config;
