/** @type {import('tailwindcss').Config} */

// import inter font
const defaultTheme = require("tailwindcss/defaultTheme");


module.exports = {
    mode: "jit",
    content: ["./src/views/**/*.{html,hbs}", "./public/**/*.html"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans],
            },
            screens: {
                '3xl': '1920px',
            }
        },
        
    },
    plugins: [require("@tailwindcss/forms")],
};