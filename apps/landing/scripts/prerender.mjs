// Runs after `vite build`. Renders every page to HTML and writes it into
// dist/<page>.html, so the text is in the file itself: search engines,
// link previews and Google Play's policy checker can read it without
// running JavaScript. In the browser, React then takes over (hydrates).
//
// Safe by design: if anything fails here the build still succeeds and
// the site simply stays client-rendered, as it was before.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const server = await createServer({
  root,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
});

let done = 0;
try {
  const { pageNames, renderPage } = await server.ssrLoadModule("/src/ssr.tsx");
  for (const name of pageNames) {
    const file = resolve(root, "dist", `${name}.html`);
    try {
      if (!existsSync(file)) throw new Error("dist file not found");
      const html = readFileSync(file, "utf8");
      if (!html.includes('<div id="root"></div>')) throw new Error("root element not found");
      writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${renderPage(name)}</div>`));
      done += 1;
    } catch (err) {
      console.warn(`prerender: skipped ${name}: ${err.message}`);
    }
  }
} catch (err) {
  console.warn(`prerender: failed, leaving pages client-rendered: ${err.message}`);
} finally {
  await server.close();
}
console.log(`prerender: wrote text into ${done} page(s)`);
