/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            animation: {
                pulse: 'pulse 2s infinite ease-in-out',
                twinkle: 'twinkle 5s infinite ease-in-out'
            },
        },
    },
    plugins: [],
}; 