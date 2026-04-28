import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['7374-117-216-241-16.ngrok-free.app'],
    port: 5173,
  },
});
