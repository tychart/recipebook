import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BorderThemeProvider } from "./context/BorderThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BorderThemeProvider>
      <App />
    </BorderThemeProvider>
  </StrictMode>,
);
