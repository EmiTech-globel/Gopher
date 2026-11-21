import { useState, type FormEvent, type ReactNode } from "react";
import { SUPPORT_EMAIL, SUPPORT_HOURS, SUPPORT_WHATSAPP } from "../site";

type Info = { label: string; value: ReactNode };

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // No backend: the form opens the visitor's email app with the message filled in.
  function send(e: FormEvent) {
    e.preventDefault();
    const body = `${message}\n\n${name} (${email})`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Gopher support")}&body=${encodeURIComponent(body)}`;
  }

  const info: Info[] = [
    ...(SUPPORT_EMAIL ? [{ label: "Email", value: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> }] : []),
    ...(SUPPORT_WHATSAPP ? [{ label: "WhatsApp", value: <a href={`https://wa.me/${SUPPORT_WHATSAPP}`}>Chat with us</a> }] : []),
    ...(SUPPORT_HOURS ? [{ label: "Support hours", value: SUPPORT_HOURS }] : []),
    { label: "Disputes", value: "We aim to review every dispute within 24 hours." },
    { label: "Find us", value: "PTI Effurun, Delta State" },
  ];

  return (
    <section className="wrap section">
      <h1 className="page-title">Contact us</h1>
      <p className="lead">Questions, bug reports or a problem with an errand? We read every message.</p>
      <div className="contact">
        <div className="contact-cards">
          {info.map((i) => (
            <div key={i.label} className="info">
              <div className="label">{i.label.toUpperCase()}</div>
              <div className="value">{i.value}</div>
            </div>
          ))}
        </div>
        {SUPPORT_EMAIL && (
          <form className="form" onSubmit={send}>
            <h2>Send a message</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" required />
            <button className="btn" type="submit">
              Send message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
