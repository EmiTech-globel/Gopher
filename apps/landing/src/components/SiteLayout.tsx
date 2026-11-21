import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LEGAL_LINKS } from "../legal";
import { FOOTER_LINKS, NAV_LINKS, SUPPORT_EMAIL, SUPPORT_PHONE } from "../site";
import { ArrowUpIcon } from "./icons";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [activeHref, setActiveHref] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const onScroll = () => setShowScrollTop(window.scrollY > 400);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (pathname !== "/") {
      setActiveHref(pathname);
      return () => window.removeEventListener("scroll", onScroll);
    }

    setActiveHref("/");
    const sectionLinks: Array<[string, string]> = [
      ["home", "/"],
      ["how", "/#how"],
      ["users", "/"],
      ["scouts", "/scouts"],
    ];
    const sections = sectionLinks
      .map(([id, href]) => {
        const element = document.getElementById(id);
        return element ? { element, href } : null;
      })
      .filter((section): section is { element: HTMLElement; href: string } => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const match = sections.find(({ element }) => element === visible.target);
        if (match) setActiveHref(match.href);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4] },
    );

    sections.forEach(({ element }) => observer.observe(element));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <header className="wrap nav">
        <a className="brand" href="/">
          <img className="brand-logo" src="/gopher-logo.png" alt="" width={36} height={36} />
          <span className="brand-name">Gopher</span>
        </a>
        <nav className="nav-links">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={activeHref === l.href ? "active" : undefined}
              aria-current={activeHref === l.href ? "page" : undefined}
            >
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
                <a
                  key={l.href}
                  href={l.href}
                  className={activeHref === l.href ? "active" : undefined}
                  aria-current={activeHref === l.href ? "page" : undefined}
                >
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
            <img className="brand-logo footer-logo" src="/gopher-logo.png" alt="" width={30} height={30} />
            <span className="brand-name">Gopher</span>
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
        <div className="col">
          <b>Legal</b>
          {LEGAL_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="copy">© 2026 TrixStudio. All rights reserved.</div>
      </footer>
      <button
        type="button"
        className={`scroll-top${showScrollTop ? " visible" : ""}`}
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUpIcon />
      </button>
    </>
  );
}
