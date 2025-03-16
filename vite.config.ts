import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: path.resolve("index.html"), // Keep popup build
        background: path.resolve("src/background.js"), // Background script
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === "background"
            ? "[name].js"
            : "assets/[name]-[hash].js";
        },
      },
    },
  },
});
