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
                primary:           "#6366f1",  // indigo-500
                "primary-dark":    "#4f46e5",  // indigo-600
                "primary-light":   "#eef2ff",  // indigo-50
                "background-light": "#f8fafc",
                "background-dark":  "#0f172a",
                indigo: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    200: "#c7d2fe",
                    300: "#a5b4fc",
                    400: "#818cf8",
                    500: "#6366f1",
                    600: "#4f46e5",
                    700: "#4338ca",
                    800: "#3730a3",
                    900: "#312e81",
                },
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                display: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "0.75rem",
                xl: "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
                full: "9999px",
            },
            boxShadow: {
                "sm":  "0 1px 2px 0 rgb(0 0 0 / 0.04)",
                DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
                "md":  "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
                "lg":  "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
                "xl":  "0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.07)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
                slideUp: {
                    "0%": { opacity: 0, transform: "translateY(8px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
