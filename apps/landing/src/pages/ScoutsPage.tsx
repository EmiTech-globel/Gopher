const NEEDS = [
  { title: "Your student details", text: "Your PTI student ID and matric number." },
  { title: "A live selfie and ID photo", text: "Taken inside the app in real time. Gallery uploads are not allowed." },
  { title: "A bank account", text: "A Nigerian account where your earnings are paid." },
];

const TIERS = [
  ["Your item cost", "Returned after the user confirms delivery", "Paid to you as soon as you accept"],
  ["Errands you see", "Lower-value errands", "All errands"],
  ["How you move up", "Starts at signup", "Complete 3 errands with no unresolved disputes"],
];

const PAYOUT = [
  { tag: "Friday", title: "Your payment slip", text: "An itemised list of your errands and what you earned, sent on WhatsApp and kept in the app." },
  { tag: "Saturday", title: "One transfer", text: "Your earnings land in your bank account in a single weekly transfer." },
  { tag: "One week behind", title: "Paid in arrears", text: "This week’s earnings arrive on next week’s Saturday. Your first payout date is shown when you sign up." },
];

export function ScoutsPage() {
  return (
    <>
      <section className="wrap hero">
        <div className="hero-text">
          <h1>Run errands. Earn on your schedule.</h1>
          <p className="lead">
            Any verified PTI student can become a scout. Pick errands from the open pool, deliver them,
            and earn a delivery fee every time.
          </p>
          <a className="btn" href="/download">
            Download and sign up
          </a>
        </div>
        <div className="hero-visual">
          <img className="feature-img" src="/img/door-delivery.jpg" alt="A scout handing over an order at the door" style={{ objectPosition: "center 30%" }} />
        </div>
      </section>

      <section className="wrap section">
        <h2>What you need</h2>
        <div className="cards3">
          {NEEDS.map((n, i) => (
            <div key={n.title} className="card">
              <div className="num">{i + 1}</div>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </div>
          ))}
        </div>
        <p className="note">
          Verification takes 24 to 48 hours. If a submission is rejected you will see the reason and can
          resubmit up to 3 times.
        </p>
      </section>

      <section className="wrap section">
        <h2>Two stages of scout</h2>
        <p className="note" style={{ marginTop: 0, marginBottom: 24 }}>
          Everyone starts as a new scout and moves up after proving themselves.
        </p>
        <div className="tiers">
          <div className="tier-row head">
            <span />
            <span>New scout</span>
            <span>Trusted scout</span>
          </div>
          {TIERS.map(([label, a, b]) => (
            <div key={label} className="tier-row">
              <b>{label}</b>
              <span data-label="New scout">{a}</span>
              <span data-label="Trusted scout">{b}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap split rev">
        <img className="split-img" src="/img/shop-counter.jpg" alt="A scout buying an item at a shop counter" style={{ objectPosition: "center 40%" }} loading="lazy" />
        <div className="split-text">
          <h2>How you get paid</h2>
          <div className="pay">
            {PAYOUT.map((p) => (
              <div key={p.title} className="pay-item">
                <span className="chip">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="cta cta-plum">
          <h2>Ready to start earning?</h2>
          <p>Download Gopher, tap Become a scout and submit your details.</p>
          <a className="btn btn-blush" href="/download">
            Download for Android
          </a>
        </div>
      </section>
    </>
  );
}
