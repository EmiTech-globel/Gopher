import { readdirSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Multi-page site, not a client-side router: every *.html file in this
// folder becomes its own entry and its own static page. That keeps each
// page crawlable and fast, and keeps the flyer (print-only CSS, no site
// layout) completely separate. To add a page, add an .html file and a
// matching src/entries/<name>.tsx.
const input = Object.fromEntries(
  readdirSync(__dirname)
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(/\.html$/, ""), resolve(__dirname, f)]),
);

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input } },
});
