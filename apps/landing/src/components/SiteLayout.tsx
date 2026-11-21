import type { ReactNode } from "react";
import { FOOTER_LINKS, NAV_LINKS, SUPPORT_EMAIL, SUPPORT_PHONE } from "../site";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="wrap nav">
        <a className="brand" href="/">
          Gopher
        </a>
        <nav className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <a className="btn btn-sm" href="/download">
            Download
          </a>
          <details className="menu">
            <summary aria-label="Menu">
              <span />
              <span />
            </summary>
            <div className="menu-list">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          </details>
        </div>
      </header>
      <main>{children}</main>
      <footer className="wrap footer">
        <div>
          <a className="brand" href="/">
            Gopher
          </a>
          {SUPPORT_EMAIL && (
            <>
              {SUPPORT_EMAIL}
              <br />
            </>
          )}
          {SUPPORT_PHONE && (
            <>
              {SUPPORT_PHONE}
              <br />
            </>
          )}
          PTI Effurun, Delta State
        </div>
        <div className="col">
          <b>Gopher</b>
          {FOOTER_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="copy">© 2026 TrixStudio. All rights reserved.</div>
      </footer>
    </>
  );
}
