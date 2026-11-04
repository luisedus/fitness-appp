import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { OfflineBanner } from "./components/OfflineBanner";
import { setupPWA } from "./lib/pwa";

setupPWA();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <OfflineBanner />
  </>,
);
