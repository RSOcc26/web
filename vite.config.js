import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Same origin as in production, where the Ingress routes /api to the gateway
    proxy: { '/api': process.env.GATEWAY_URL ?? 'http://localhost:8080' },
  },
  test: {
    include: ['test/unit/**/*.test.{js,jsx}'],
  },
});
