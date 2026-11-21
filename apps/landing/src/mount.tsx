import { StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { SiteLayout } from "./components/SiteLayout";
import "./tokens.css";
import "./site.css";

export function mount(page: ReactNode) {
  const root = document.getElementById("root")!;
  const app = (
    <StrictMode>
      <SiteLayout>{page}</SiteLayout>
    </StrictMode>
  );
  // Built pages already contain their text (see scripts/prerender.mjs),
  // so React attaches to it; the dev server serves an empty root.
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
