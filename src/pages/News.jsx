import React, { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Using RSS to JSON proxy to pull live news from CoinTelegraph
        const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss");
        const d = await res.json();
        if (!cancelled && d.status === "ok" && d.items) {
          const formattedNews = d.items.map((item) => ({
            title: item.title,
            body: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            source: "Cointelegraph",
            url: item.link,
            imageurl: item.thumbnail || (item.enclosure && item.enclosure.link) || "",
            published_on: new Date(item.pubDate).getTime() / 1000
          }));
          setNews(formattedNews);
        }
      } catch (e) {
        console.error("News fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
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
        {loading ? (
             <div className="sub" style={{ padding: '20px 0' }}>Loading latest news...</div>
        ) : news.length === 0 ? (
             <div className="card">No news available. Please check your connection.</div>
        ) : (
             news.map((n, i) => <NewsCard key={i} item={n} />)
        )}
      </div>
    </div>
  );
}
