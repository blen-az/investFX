import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { checkAndAutoCloseTrades } from "../services/tradeService";
import { getCryptoPrices } from "../services/priceService";
import { DesktopSidebar, DesktopTopBar } from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTrades, setActiveTrades] = useState([]);

  const isTradePage = location.pathname === "/trade";
  const isAgentPage = location.pathname.startsWith("/agent");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/"].includes(location.pathname);
  const isSpecialPage = isAgentPage || isAdminPage;

  // Keep track of user's active trades globally so expired trades settle even when away from /trade
  useEffect(() => {
    if (!user?.uid || isTradePage) {
      setActiveTrades([]);
      return;
    }

    const q = query(
      collection(db, "trades"),
      where("uid", "==", user.uid),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAtMs ? new Date(data.createdAtMs) : new Date()),
          };
        });
        setActiveTrades(list);
      },
      (err) => {
        console.warn("Global active trades listener error:", err);
      }
    );

    return () => unsub();
  }, [user?.uid, isTradePage]);

  useEffect(() => {
    if (!user?.uid || isTradePage || activeTrades.length === 0) return;

    const timer = setInterval(async () => {
      try {
        const prices = await getCryptoPrices();
        await checkAndAutoCloseTrades(user.uid, activeTrades, prices);
      } catch (err) {
        console.warn("Global trade auto-close error:", err);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [user?.uid, isTradePage, activeTrades]);

  // Auth / Landing pages — no shell
  if (isAuthPage) {
    return (
      <div className="app" style={{ background: "var(--wm-bg)" }}>
        {children}
      </div>
    );
  }

  // Admin / Agent pages — use original dark shell (Navbar hidden by CSS on mobile)
  if (isSpecialPage) {
    return (
      <div className="app">
        <DesktopSidebar />
        <DesktopTopBar />
        <div className="page-wrap">
          <div className={isTradePage ? "container-fluid" : "container"}>
            {children}
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  // Normal user pages
  return (
    <div className="app">
      {/* Desktop: sidebar + topbar */}
      <DesktopSidebar />
      <DesktopTopBar />

      {/* Mobile: top header */}
      <MobileHeader />

      {/* Content */}
      <div className="page-wrap">
        <div className={isTradePage ? "container-fluid" : "container"}>
          {children}
        </div>
      </div>

      {/* Mobile: floating bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
