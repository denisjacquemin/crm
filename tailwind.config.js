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
                '2lg': '1124px',
                '3xl': '1920px',
            },
            width: {
                '88': '22rem'
            }
        },
        
    },
    plugins: [require("@tailwindcss/forms")],
};