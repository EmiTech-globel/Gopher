/**
 * Terms & Conditions — single source of truth.
 *
 * Bump TERMS_VERSION whenever the content below changes in a way that
 * matters legally (not just typo fixes). route-after-auth.ts compares a
 * user's stored profiles.terms_version against this constant and routes
 * them back through /terms-and-conditions to re-accept if they differ —
 * this is how the planned future policy change noted in spec Section 23
 * (any ban forfeits all pending Commission) will get rolled out once
 * it's ready: update the section below, bump the version, and every
 * existing user is re-gated on next login.
 */
export const TERMS_VERSION = "2026-08-01";
export const TERMS_LAST_UPDATED = "August 1, 2026";

export interface TermsSection {
  title: string;
  paragraphs: string[];
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "1. What Gopher is",
    paragraphs: [
      "Gopher is a peer-to-peer errand platform for verified students of PTI Effurun. Users post errands and pay for them upfront through the app; Scouts — fellow verified students — accept, complete, and deliver those errands to earn a fee. Gopher is not a delivery company and does not employ Scouts; Scouts are independent students choosing to run errands for a Commission.",
    ],
  },
  {
    title: "2. Escrow and payment",
    paragraphs: [
      "When you post an errand, your payment is collected upfront and held by Gopher until both sides of the errand are complete. Funds are only released to a Scout after you confirm delivery, or automatically after 24 hours if you don't respond.",
      "Paystack's own payment processing fee is never refundable, even if the underlying errand is cancelled or refunded. This applies to every cancellation scenario described in Section 4 below.",
    ],
  },
  {
    title: "3. Delivery fees and the Charges Fee",
    paragraphs: [
      "The delivery fee you pay is split: Scouts keep the majority as their Commission, and Gopher retains 18% as its Charges Fee. This percentage applies only to the delivery fee — never to the item cost, which is your own money for whatever was purchased on your behalf.",
    ],
  },
  {
    title: "4. Cancellations",
    paragraphs: [
      "You can cancel an errand before a Scout accepts it, or within a short grace window right after acceptance, with a full refund of both item cost and delivery fee (processing fees remain non-refundable, as above).",
      "Cancelling after the grace window but before the Scout has purchased the item is still refundable, but affects your reputation on the platform.",
      "Cancelling or going silent after a Scout has already spent their own money to buy your item is treated as a dispute, not a simple cancellation, and is resolved through the dispute process below.",
    ],
  },
  {
    title: "5. Disputes",
    paragraphs: [
      "If something goes wrong — an item isn't delivered, isn't what was ordered, or there's disagreement over a price change — either party can open a dispute instead of confirming delivery. Disputes pause any pending payment release until an admin reviews the chat history, photos, and status timeline for that errand and decides an outcome: releasing funds to the Scout, refunding the User, splitting the outcome, or escalating to a suspension.",
      "Gopher aims to review disputes within 24 hours, though this is a target rather than a guarantee.",
    ],
  },
  {
    title: "6. Scout identity verification and photo storage",
    paragraphs: [
      "Scouts must submit a live selfie and a live photo of their student ID, taken directly through the app's camera, before they can accept errands. By registering as a Scout, you consent to Gopher storing these images indefinitely in a restricted, non-public storage location accessible only to Gopher's admin team, for identity verification and fraud-prevention purposes — including preventing a banned account from re-registering under a new identity. These images are never shown to Users or other Scouts.",
    ],
  },
  {
    title: "7. Bans and account suspension",
    paragraphs: [
      "Accounts found to have committed fraud, repeated policy violations, or serious misconduct may be suspended or permanently banned. If your Scout account is banned, only Commission tied to the errand(s) that caused the ban — or under an active dispute — is forfeited. Any other clean, undisputed Commission you've already earned is still paid out to your bank account on file, even after a ban, under the current policy described here.",
      "This policy may change in the future as Gopher grows — for example, a stricter policy where any ban forfeits all pending Commission with no exceptions. If that change is adopted, you'll be notified and asked to accept updated Terms before continuing to use the app; it will never be applied retroactively without notice.",
    ],
  },
  {
    title: "8. Your responsibilities",
    paragraphs: [
      "You agree to provide accurate information at signup, use your own identity (Scouts must be real, currently enrolled PTI students), and interact honestly with other students on the platform. Misrepresenting an item's price, faking proof of purchase, or impersonating another student are treated as fraud under Section 7.",
    ],
  },
  {
    title: "9. Changes to these terms",
    paragraphs: [
      "Gopher may update these Terms as the platform evolves. Material changes will require you to review and re-accept them before you can continue using the app — you'll never be silently opted into a materially different policy.",
    ],
  },
];
