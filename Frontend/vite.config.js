import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "../Backend/wwwroot",
    emptyOutDir: true
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    include: ["src/tests/**/*.test.jsx", "src/tests/**/*.test.js"]
  }
});
