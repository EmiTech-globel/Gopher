// Legal-page settings. Kept apart from site.ts so contact details and
// legal settings can be edited independently.

// Shown on the legal pages when set, e.g. "21 November 2026".
export const LEGAL_UPDATED = "";
// How many days account deletion takes, e.g. "14". Left empty the page says "as soon as we can".
export const DELETION_DAYS = "";

export const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cancellation and Refund Policy", href: "/refunds" },
  { label: "Delete your account", href: "/delete-account" },
];
