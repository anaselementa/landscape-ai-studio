import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: "#315f43",
        soil: "#6d5948",
        sand: "#f5f1e8",
        clay: "#b36b45",
        water: "#256d85"
      }
    }
  },
  plugins: []
};

export default config;
