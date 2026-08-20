import { useEffect, useRef, useState } from "react";
import { QrCode } from "./QrCode";
import { APK_DOWNLOAD_URL, isApkUrlConfigured } from "./config";
import "./LandingPage.css";

const STEPS = [
  "Open the downloaded file (check your Downloads or Notifications).",
  "If prompted, tap Settings and allow installs from this source, a one-time step for apps outside the Play Store.",
  "Tap Install, then open Gopher and sign up with your school email.",
];

export function LandingPage() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [statusText, setStatusText] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);

    if (isApkUrlConfigured()) {
      const timer = setTimeout(() => {
        linkRef.current?.click();
        setStatusText("Your download should start automatically.");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="landing">
      <img src="/gopher-logo.png" alt="Gopher" className="landing-logo" />
      <h1>
        Get <span className="accent-word">Gopher</span>
      </h1>
      <p className="tagline">
        Post an errand or run one and earn,built by TrixStudio, for students at PTI Effurun.
      </p>

      <a ref={linkRef} className="download-btn" href={APK_DOWNLOAD_URL} download>
        Download for Android
      </a>
      <p className="download-note">Free. No Play Store account needed.</p>
      <p className="status-line">{statusText}</p>

      <div className="card">
        <h2>After it downloads</h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="qr-card">
        <h2>Share this page</h2>
        {pageUrl && <QrCode url={pageUrl} size={160} className="qr-image" />}
        <p>Scan to open this page on another phone — print it for a campus flyer.</p>
      </div>

      <footer>Gopher &middot; TrixStudio &middot; PTI Effurun</footer>
    </div>
  );
}
