import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                gold: {
                    DEFAULT: '#f9b233',
                    50: '#fef7e7',
                    100: '#fdecc4',
                    200: '#fbd88a',
                    300: '#f9c455',
                    400: '#f9b233',
                    500: '#e89a12',
                    600: '#c67d0d',
                    700: '#9c6110',
                    800: '#7d4d14',
                    900: '#684014',
                },
                ink: {
                    DEFAULT: '#0b0b0d',
                    800: '#141416',
                    700: '#1b1b1f',
                    600: '#232329',
                },
            },
        },
    },

    plugins: [forms],
};
