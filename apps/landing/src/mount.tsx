import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SiteLayout } from "./components/SiteLayout";
import "./tokens.css";
import "./site.css";

export function mount(page: ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <SiteLayout>{page}</SiteLayout>
    </StrictMode>,
  );
}
