import { ContactLine, LegalPage } from "../components/LegalPage";

const ROWS = [
  ["Before any scout accepts", "Full refund", "Full refund", "Not refunded"],
  ["Within 2 to 3 minutes of a scout accepting", "Full refund", "Full refund", "Not refunded"],
  ["After that, before the scout buys", "Full refund", "Full refund", "Not refunded"],
  ["After the scout has bought the item", "Handled as a dispute", "Handled as a dispute", "Not refunded"],
];

export function RefundsPage() {
  return (
    <LegalPage
      title="Cancellation and Refund Policy"
      intro="Here is exactly what happens to your money when you cancel an errand. The rules are the same for everyone."
      sections={[
        { heading: "The processing fee", body: "Paystack charges a fee to collect your payment, and it is shown in your checkout total. It is never refunded, even when the rest of your money is." },
        { heading: "Cancelling after the item is bought", body: "If you cancel or disappear once a scout has bought your item, it becomes a dispute and our team reviews the full record." },
        { heading: "Reputation", body: "Cancelling after the free window, before purchase, adds a mark to your reputation. There is no cancellation charge." },
        { heading: "Scout cancellations", body: "A scout can back out before buying and the errand returns to the pool. Backing out after buying is handled as a dispute." },
        { heading: "How long refunds take", body: "Approved refunds usually reach your account within 3 to 10 working days." },
        { heading: "Contact", body: <ContactLine prefix="Questions about a refund:" /> },
      ]}
    >
      <div className="refund-table">
        <div className="refund-row head">
          <span>When you cancel</span>
          <span>Item cost</span>
          <span>Delivery fee</span>
          <span>Processing fee</span>
        </div>
        {ROWS.map(([when, item, fee, proc]) => (
          <div key={when} className="refund-row">
            <b>{when}</b>
            <span data-label="Item cost">{item}</span>
            <span data-label="Delivery fee">{fee}</span>
            <span data-label="Processing fee">{proc}</span>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
