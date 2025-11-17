import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Enable source maps uploading
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules'],
      },

      // Only upload source maps in production builds
      disable: process.env.NODE_ENV !== 'production',

      // Set release name
      release: {
        name: process.env.VITE_SENTRY_RELEASE,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Generate source maps for error tracking
    sourcemap: true,
  },
})
