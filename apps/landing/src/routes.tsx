import type { ComponentType } from "react";
import { ContactPage } from "./pages/ContactPage";
import { DeleteAccountPage } from "./pages/DeleteAccountPage";
import { DownloadPage } from "./pages/DownloadPage";
import { FaqPage } from "./pages/FaqPage";
import { HomePage } from "./pages/HomePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RefundsPage } from "./pages/RefundsPage";
import { ScoutsPage } from "./pages/ScoutsPage";
import { TermsPage } from "./pages/TermsPage";

// Page name -> component. The name is the .html file it lives in
// (index -> index.html). scripts/prerender.mjs uses this to write each
// page's text into its HTML at build time. When you add a page, add it
// here as well as its .html file and src/entries/<name>.tsx.
export const PAGES: Record<string, ComponentType> = {
  index: HomePage,
  download: DownloadPage,
  scouts: ScoutsPage,
  faq: FaqPage,
  contact: ContactPage,
  terms: TermsPage,
  privacy: PrivacyPage,
  refunds: RefundsPage,
  "delete-account": DeleteAccountPage,
};
