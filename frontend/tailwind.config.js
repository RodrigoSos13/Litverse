/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f3f7fd",
        parchment: "#182437",
        copper: "#d8a24a",
        forest: "#c53b4c",
        berry: "#8f2333",
        midnight: "#09111f",
        panel: "#111c2d",
        panelSoft: "#18263a",
        line: "#29374d",
        mist: "#b7c5d8",
        glow: "#ffe3c7",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Trebuchet MS", "sans-serif"],
      },
      boxShadow: {
        card: "0 22px 60px rgba(2, 6, 23, 0.45)",
      },
    },
  },
  plugins: [],
};
