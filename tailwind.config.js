/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy:         '#0F2340',
                primary:      '#1B4F8A',
                'mid-blue':   '#2E6DA4',
                'light-blue': '#D6E8F7',
                accent:       '#E07B20',
                body:         '#333333',
                muted:        '#777777',
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                sora: ['Sora', 'sans-serif'],
            },
        },
    },
    plugins: [],
}