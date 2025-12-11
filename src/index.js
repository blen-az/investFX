import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./mobile.css"; // Mobile responsiveness improvements
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

// Remove initial HTML loader once React has mounted
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.3s ease';
    setTimeout(() => loader.remove(), 300);
  }
}, 100);

// Keep everything the same
reportWebVitals();
