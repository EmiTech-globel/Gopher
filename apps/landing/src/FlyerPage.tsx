import { useEffect, useState } from "react";
import { QrCode } from "./QrCode";
import "./FlyerPage.css";

export function FlyerPage() {
  const [landingUrl, setLandingUrl] = useState("");

  useEffect(() => {
    // Points at index.html (the actual download page), not this
    // flyer page itself — scanning should land on the fallback
    // button and install instructions, not another poster.
    setLandingUrl(window.location.href.replace(/flyer\.html.*$/, ""));
  }, []);

  return (
    <>
      <div className="print-controls">
        <button onClick={() => window.print()}>Print this flyer</button>
      </div>

      <div className="flyer">
        <img src="/gopher-logo.png" alt="Gopher" className="flyer-logo" />
        <h1>Gopher</h1>
        <p className="tagline">Need something? Send a Gopher.</p>
        <p className="subtagline">
          Post an errand or run one and earn — the campus errand app built by students, for
          students at PTI Effurun.
        </p>

        <div className="qr-wrap">{landingUrl && <QrCode url={landingUrl} size={500} />}</div>
        <p className="scan-label">Scan to download</p>

        <p className="footer">
          <strong>TrixStudio</strong> &middot; Free &middot; No Play Store needed
        </p>
      </div>
    </>
  );
}
