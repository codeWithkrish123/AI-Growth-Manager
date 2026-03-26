/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#2563eb",
                "primary-dark": "#1d4ed8",
                "primary-light": "#eff6ff",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "display": ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "2xl": "1.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
