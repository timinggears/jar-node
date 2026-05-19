import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app/dist/esm/index.esm.js'),
        'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth/dist/esm/index.esm.js'),
        'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore/dist/esm/index.esm.js'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
