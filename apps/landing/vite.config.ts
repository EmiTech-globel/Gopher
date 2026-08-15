import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Two separate entry points, not React Router client-side routes —
// the flyer page has fundamentally different needs (print-only CSS,
// a light background, no auto-download script) and should load and
// render standalone without pulling in the landing page's JS at all.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        flyer: resolve(__dirname, "flyer.html"),
      },
    },
  },
});
