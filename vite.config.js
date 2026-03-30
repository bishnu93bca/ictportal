import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
            buildDirectory: 'build',
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        outDir: 'build',   // 👈 THIS creates root build folder
        emptyOutDir: true,
    },
});