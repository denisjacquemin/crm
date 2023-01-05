/** @type {import('tailwindcss').Config} */

// import inter font
const defaultTheme = require("tailwindcss/defaultTheme");


module.exports = {
    mode: "jit",
    content: ["./src/views/**/*.{html,hbs}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};