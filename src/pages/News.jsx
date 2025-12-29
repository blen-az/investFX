import React, { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard";

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Using CryptoCompare News API (Free, no key needed usually for basic endpoints)
        const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
        const d = await res.json();
        if (!cancelled && d.Data) {
          setNews(d.Data.slice(0, 50));
        }
      } catch (e) {
        console.error("News fetch error:", e);
        setNews([]);
      }
    }
    load();
    return () => cancelled = true;
  }, []);

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="h1">News</h1>
          <div className="sub">Latest crypto events & headlines</div>
        </div>
      </div>

      <div className="news-grid">
        {news.length === 0 ? <div className="card">No news available</div> : news.map((n, i) => <NewsCard key={i} item={n} />)}
      </div>
    </div>
  );
}
