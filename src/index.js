import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
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

// Remove initial HTML loader after minimum display time
// This ensures users see the premium animations
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => loader.remove(), 500);
  }
}, 2000); // Minimum 2 seconds to show animations

// Keep everything the same
reportWebVitals();
