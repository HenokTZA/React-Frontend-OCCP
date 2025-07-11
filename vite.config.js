// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: {
      //                         ┌─ backend
      // any /api request  ─────► http://127.0.0.1:8000
      "/api": "http://127.0.0.1:8000",
    },
  },
});



