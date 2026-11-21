import { useEffect, useRef, useState } from "react";
import { DownloadIcon } from "../components/icons";
import { QrCode } from "../QrCode";
import { APK_DOWNLOAD_URL, isApkUrlConfigured } from "../config";

const STEPS = [
  {
    title: "Download the file.",
    text: "Tap the button above. Your phone may warn that the file could be harmful; choose to keep it.",
  },
  {
    title: "Open it.",
    text: "Tap the downloaded file from your notifications or your Downloads folder.",
  },
  {
    title: "Allow the install.",
    text: "If asked, tap Settings and allow installs from this source, then tap Install. This is a one-time step for apps outside the Play Store.",
  },
  {
    title: "Sign up.",
    text: "Open Gopher and create your account. Your verification code may land in spam, so check there and mark it as not spam.",
  },
];

export function DownloadPage() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [status, setStatus] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
    if (!isApkUrlConfigured()) return;
    // Spec Section 21: start the download on load, with the visible
    // button as the fallback for browsers that block it.
    const timer = setTimeout(() => {
      linkRef.current?.click();
      setStatus("Your download should start automatically.");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="wrap dl">
      <div className="dl-main">
        <h1>Get Gopher for Android</h1>
        <p className="lead">Download, install and sign up in a few minutes. No store account needed.</p>
        <div className="hero-actions">
          <a ref={linkRef} className="btn" href={APK_DOWNLOAD_URL} download>
            <DownloadIcon />
            Download for Android
          </a>
        </div>
        <p className="muted status" aria-live="polite">
          {status}
        </p>
        <div className="pills">
          <span className="pill">iOS: coming soon</span>
          <span className="pill">Play Store: coming soon</span>
        </div>
        <h2>How to install</h2>
        <ol className="install">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <b>
                {i + 1}. {s.title}
              </b>{" "}
              {s.text}
            </li>
          ))}
        </ol>
      </div>
      <div className="dl-side">
        <div className="phone">
          <img src="/img/app-home.png" alt="The Gopher app home screen" width={720} height={1600} />
        </div>
        <div className="qr-box">
          {pageUrl && <QrCode url={pageUrl} size={150} />}
          <span className="muted">Scan to open this page on another phone</span>
        </div>
      </div>
    </section>
  );
}
