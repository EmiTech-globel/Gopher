const QA = [
  ["Who can use Gopher?", "Verified students of PTI Effurun. Everyone signs up with their own account, and scouts are verified with a live selfie and student ID."],
  ["How do I pay for an errand?", "You pay upfront inside the app. Gopher holds the money until you confirm that your item has arrived."],
  ["What if the item costs more than expected?", "Your scout asks for more funds in the chat and attaches a photo or video as evidence. You approve or decline before anything is bought."],
  ["What if I receive the wrong item?", "Open a dispute from the errand. Our team reviews the chat, photos and timeline, and aims to respond within 24 hours."],
  ["Can I cancel an errand?", "Yes. Your item cost and delivery fee are refunded in full if the scout has not bought the item yet. The payment processing fee is not refundable."],
  ["How long does scout verification take?", "24 to 48 hours. If a submission is rejected you will see the reason and can try again."],
  ["When do scouts get paid?", "Every Saturday, one week behind. A payment slip is sent on Friday."],
  ["Are my ID photos safe?", "They are kept in restricted storage that only Gopher admins can open."],
];

export function FaqPage() {
  return (
    <section className="wrap faq">
      <h1 className="page-title">Frequently asked questions</h1>
      <p className="lead">Quick answers about errands, payments and scouting.</p>
      {QA.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <p className="note">
        Still stuck? <a href="/contact">Contact support</a>
      </p>
    </section>
  );
}
