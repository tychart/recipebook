import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BorderThemeProvider } from "./context/BorderThemeContext";
import { IngredientAmountDisplayProvider } from "./context/IngredientAmountDisplayContext";
import { ThemeProvider } from "./context/ThemeContext";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <IngredientAmountDisplayProvider>
        <BorderThemeProvider>
          <App />
        </BorderThemeProvider>
      </IngredientAmountDisplayProvider>
    </ThemeProvider>
  </StrictMode>,
);
