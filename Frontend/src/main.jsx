import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app/App";
import { AuthProvider } from "./app/auth";
import "./styles.css";

console.log("Generic log with value (now)", new Date().toISOString());
console.info("Informatic log");
console.warn("Warning log");
console.error("Error log");
console.table({ key: "This year", timestamp: new Date().getFullYear });
console.table({ key: "This date", timestamp: new Date().getDate() });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
