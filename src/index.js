import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./mobile-fullwidth.css";
// import "./mobile.css"; // REMOVED - conflicts with responsive styles in index.css and App.css
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// AuthProvider wraps the entire app
import { AuthProvider } from "./contexts/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </AuthProvider>
);

// Keep everything the same
reportWebVitals();
