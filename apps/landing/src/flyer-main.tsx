import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FlyerPage } from "./FlyerPage";
import "./tokens.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FlyerPage />
  </StrictMode>
);
