import { renderToString } from "react-dom/server";
import { SiteLayout } from "./components/SiteLayout";
import { PAGES } from "./routes";

export const pageNames = Object.keys(PAGES);

export function renderPage(name: string): string {
  const Page = PAGES[name];
  return renderToString(
    <SiteLayout>
      <Page />
    </SiteLayout>,
  );
}
