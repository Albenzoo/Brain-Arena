import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: mode === 'development' ? [basicSsl()] : [],
    server: {
        port: 4000,
        https: mode === 'development', // HTTPS only in dev
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: false, // Disable sourcemaps in production
        rollupOptions: {
            output: {
                manualChunks: {
                    'three': ['three'], // Three.js in dedicated chunk
                }
            }
        }
    }
}));