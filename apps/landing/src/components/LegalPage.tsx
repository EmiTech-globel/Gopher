import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "../legal";
import { SUPPORT_EMAIL } from "../site";

export type LegalSection = { heading: string; body: ReactNode };

// "Email us" when a support email is set, otherwise a link to the contact page.
export function ContactLine({ prefix }: { prefix: string }) {
  return (
    <>
      {prefix}{" "}
      {SUPPORT_EMAIL ? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> : <a href="/contact">contact us</a>}.
    </>
  );
}

export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <article className="wrap legal">
      <h1 className="page-title">{title}</h1>
      {LEGAL_UPDATED && <div className="muted">Last updated: {LEGAL_UPDATED}</div>}
      <p className="lead">{intro}</p>
      {children}
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </article>
  );
}
