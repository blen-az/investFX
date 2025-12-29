import React from "react";
import "./NewsCard.css"; // Ensure you create/check this CSS or use existing styles

export default function NewsCard({ item }) {
  if (!item) return null;

  // Map CryptoCompare fields or fallback
  const title = item.title || "Crypto News";
  const body = item.body || item.overview || "";
  const source = item.source || item.source_info?.name || "CryptoCompare";
  const url = item.url || "#";
  const image = item.imageurl || item.image || "https://placehold.co/600x400?text=News";
  const date = item.published_on
    ? new Date(item.published_on * 1000).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <a href={url} target="_blank" rel="noreferrer" className="news-card-link">
      <div className="news-card">
        <div className="news-card-image" style={{ backgroundImage: `url(${image})` }}></div>
        <div className="news-card-content">
          <div className="news-card-meta">
            <span className="news-source">{source}</span>
            <span className="news-date">{date}</span>
          </div>
          <h3 className="news-title">{title}</h3>
          <p className="news-body">
            {body.length > 100 ? body.slice(0, 100) + "..." : body}
          </p>
          <span className="read-more">Read more →</span>
        </div>
      </div>
    </a>
  );
}
