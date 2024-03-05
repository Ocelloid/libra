import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
const {nextui} = require("@nextui-org/react");

export default {
  content: ["./src/**/*.tsx", "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        poppins: ["var(--font-poppins)", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [nextui({
    prefix: "nextui", // prefix for themes variables
    addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
    defaultTheme: "dark", // default theme from the themes object
    defaultExtendTheme: "dark", // default theme to extend on custom themes
    layout: {}, // common layout tokens (applied to all themes)
    themes: {
      light: {
        layout: {}, // light theme layout tokens
        colors: {}, // light theme colors
      },
      dark: {
        layout: {}, // dark theme layout tokens
        colors: {
          
        }, // dark theme colors
      },
      // ... custom themes
    },
  })],
} satisfies Config;
