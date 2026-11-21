import { DownloadIcon, ShieldIcon } from "../components/icons";

const STEPS = [
  { title: "Post an errand", text: "Say what to buy, from where, and where to deliver." },
  { title: "Pay upfront", text: "Your money is held safely until you confirm delivery." },
  { title: "A scout accepts", text: "A chat opens so you can coordinate directly." },
  { title: "Receive and confirm", text: "Rate your scout and release the payment." },
];

const TRUST = [
  {
    title: "Verified students only",
    text: "Scouts confirm a live selfie, student ID and matric number before they can accept errands.",
  },
  {
    title: "Payments held safely",
    text: "Funds are held until delivery is confirmed, so nobody pays for an errand that never happened.",
  },
  {
    title: "Chat and fair disputes",
    text: "Every errand has its own chat, and if something goes wrong the full record is reviewed.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="wrap hero">
        <div className="hero-text">
          <h1>Your campus, delivered by students.</h1>
          <p className="lead">
            Post an errand, pay in the app, and a verified PTI student brings it to you. Or become a
            scout and earn between classes.
          </p>
          <div className="hero-actions">
            <a className="btn" href="/download">
              <DownloadIcon />
              Download for Android
            </a>
            <span className="muted">iOS coming soon</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone">
            <img src="/img/app-home.png" alt="The Gopher app home screen" width={720} height={1600} />
          </div>
        </div>
      </section>

      <section id="how" className="wrap how">
        <h2>How it works</h2>
        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card">
              <div className="num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="users" className="band">
        <div className="wrap split">
          <div className="split-text">
            <div className="eyebrow">FOR USERS</div>
            <h2>Skip the walk. Keep your day.</h2>
            <p>
              Between lectures, in your hostel or deep in a project, get what you need without leaving.
              Your payment is held safely until you confirm delivery.
            </p>
          </div>
          <img
            className="split-img"
            src="/img/student-desk.jpg"
            alt="A student studying at his desk"
            style={{ objectPosition: "center 30%" }}
            loading="lazy"
          />
        </div>
      </section>

      <section id="scouts" className="wrap split rev">
        <img
          className="split-img"
          src="/img/student-campus.jpg"
          alt="A student walking across campus with a backpack"
          style={{ objectPosition: "center 25%" }}
          loading="lazy"
        />
        <div className="split-text">
          <div className="eyebrow">FOR SCOUTS</div>
          <h2>Earn on your own schedule.</h2>
          <p>
            Get verified once with your student ID, then pick errands from the open pool whenever you
            are free. Every delivery earns a fee.
          </p>
          <a className="text-link" href="/scouts">
            Become a scout
          </a>
        </div>
      </section>

      <section className="wrap">
        <div className="trust">
          <div className="trust-head">
            <ShieldIcon />
            <h2>Built on trust</h2>
          </div>
          {TRUST.map((t) => (
            <div key={t.title}>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap gap">
        <div className="cta">
          <h2>Ready for Gopher?</h2>
          <p>Join the first students running campus errands the easy way.</p>
          <a className="btn btn-blush" href="/download">
            Download for Android
          </a>
        </div>
      </section>
    </>
  );
}
