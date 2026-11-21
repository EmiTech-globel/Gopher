import { useEffect, useState } from "react";
import { ContactLine, LegalPage, type LegalSection } from "../components/LegalPage";

const OVERVIEW: LegalSection[] = [
  { heading: "Who can use Gopher", body: "Gopher is for verified students of PTI Effurun. You must give accurate details and keep your account secure." },
  { heading: "How errands work", body: "A user posts an errand and pays upfront. A scout accepts it, buys the item and delivers it. Gopher holds the payment until the user confirms delivery." },
  { heading: "Payments", body: "Payments are processed by Paystack. A processing fee is added to your checkout total and is non-refundable, including when an errand is cancelled or refunded." },
  {
    heading: "Cancellations and disputes",
    body: (
      <>
        Cancellation rules are in our <a href="/refunds">Cancellation and Refund Policy</a>. If something goes wrong, open a dispute in the app. We aim to review disputes within 24 hours.
      </>
    ),
  },
  { heading: "Conduct, suspension and bans", body: "Dishonest behaviour can lead to a warning, suspension or a permanent ban. A banned account has 3 to 5 days to submit an appeal." },
  { heading: "Identity records", body: "To stop banned accounts registering again under a new identity, we keep scout selfies and ID photos on file, with the consent you give at signup." },
  { heading: "Changes and contact", body: <>We may update these terms and will tell you in the app. <ContactLine prefix="Questions:" /></> },
];

const USERS: LegalSection[] = [
  { heading: "Posting an errand", body: "Describe the item, where to buy it and where to deliver it. You pay the item budget, the delivery fee and a processing fee upfront." },
  { heading: "Price changes", body: "If the price is higher than expected, your scout asks for more funds in the chat with photo or video evidence. Nothing is bought until you approve." },
  { heading: "Confirming delivery", body: "Confirm in the app once your item arrives. If you do not respond within 24 hours of delivery, it is confirmed automatically and the scout is paid." },
  { heading: "Reporting a problem", body: "Open a dispute instead of confirming. Payment for that errand is paused until our team decides." },
];

const SCOUTS: LegalSection[] = [
  { heading: "Becoming a scout", body: "You must complete verification with a live selfie, a student ID photo and your matric number. Applications are reviewed within 24 to 48 hours, and a rejected application can be resubmitted up to 3 times." },
  { heading: "Buying and delivering", body: "Buy the item as ordered and deliver it to the location given. New scouts buy with their own money first and send photo proof of the purchase. Trusted scouts receive the item cost when they accept." },
  { heading: "Item cost and earnings", body: "New scouts get the item cost back after the user confirms delivery. Delivery fee earnings are paid in a weekly batch, one week behind: a payment slip is sent on Friday and one transfer is made on Saturday." },
  { heading: "Honesty", body: "Non-delivery, wrong items or inflated prices can lead to suspension or a permanent ban. If your account is banned, only earnings tied to the problem are withheld, and other earnings are still paid to your bank account." },
];

const TABS = [
  { id: "overview", label: "Overview", sections: OVERVIEW },
  { id: "users", label: "For users", sections: USERS },
  { id: "scouts", label: "For scouts", sections: SCOUTS },
];

export function TermsPage() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === hash)) setActive(hash);
  }, []);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms explain how Gopher works and what we expect from everyone who uses it. Choose your role to see the rules that apply to you."
      sections={tab.sections}
    >
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="tab" aria-pressed={t.id === active} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </LegalPage>
  );
}
