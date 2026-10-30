import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080a0b",
        panel: "#101314",
        lime: "#c5f467",
        cyan: "#79d9e8",
        amber: "#efb56c"
      }
    }
  },
  plugins: []
};

export default config;
