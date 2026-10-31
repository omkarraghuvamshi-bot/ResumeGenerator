import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api calls are forwarded to the optional Python server (server/app.py).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5000" } },
});
