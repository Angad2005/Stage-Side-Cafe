import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

/**
 * Twitch Extension Vite config.
 *
 * Builds three separate entry points for the Twitch Extension:
 * - viewer: Panel/overlay shown to viewers on the channel page
 * - config: Configuration page for the broadcaster
 * - dashboard: Live dashboard page for the broadcaster
 *
 * Twitch loads each view in its own sandboxed iframe.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        viewer: resolve(__dirname, 'viewer/index.html'),
        config: resolve(__dirname, 'config/index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
      },
    },
    outDir: 'dist',
  },
  server: {
    port: 5174,
    https: false, // Twitch Extensions require HTTPS in production
  },
})
