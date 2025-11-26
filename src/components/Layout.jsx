import React from "react";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <div className="page-wrap">
        <div className="container">{children}</div>
      </div>
    </div>
  );
}
