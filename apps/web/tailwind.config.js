/** @type {import('tailwindcss').Config} */

// slate (surfaces/text) and sky (accent) are re-pointed at CSS custom
// properties so a `data-theme` attribute on <html> can re-theme the whole
// app without touching any component — see src/theme.css for the palettes.
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
function cssVarScale(prefix) {
  return Object.fromEntries(shades.map((s) => [s, `var(--${prefix}-${s})`]));
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: cssVarScale("slate"),
        sky: cssVarScale("sky"),
      },
    },
  },
  plugins: [],
};
