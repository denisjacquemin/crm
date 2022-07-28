/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./views/**/*.{html,hbs}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
