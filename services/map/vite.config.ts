import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app only talks to the FlightFlow collector (/api, /logos). In development it is
// proxied to FLIGHTFLOW_API: a local collector by default, or e.g. http://<your-pi>:8080.
const API = process.env.FLIGHTFLOW_API ?? 'http://localhost:8001';

export default defineConfig({
  base: '/map/',
  plugins: [react()],
  // maplibre-gl alone is ~800 kB.
  build: { chunkSizeWarningLimit: 1200 },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/logos': { target: API, changeOrigin: true },
    },
  },
});
