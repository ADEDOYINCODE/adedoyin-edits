import React from "react";
import ReactDOM from "react-dom/client";
import { seed } from "./db";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./styles.css";
seed()
  .then(() =>
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    ),
  )
  .catch((e) => {
    document.getElementById("root")!.textContent =
      "Unable to open local storage: " + String(e);
  });

if (
  (import.meta as ImportMeta & { env: { PROD: boolean } }).env.PROD &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(console.error);
  });
}
