import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MarketNews() {
  const [news, setNews] = useState([]);
  const [coins, setCoins] = useState([]);

  // Fetch crypto news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(
          "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
        );
        setNews(res.data.Data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    const fetchTopCoins = async () => {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1"
        );
        setCoins(res.data);
      } catch (err) {
        console.error("Error fetching coins:", err);
      }
    };

    fetchNews();
    fetchTopCoins();
  }, []);

  return (
    <div
      style={{
        background: "black",
        color: "gold",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Market Insight</h1>

      <section>
        <h2>📰 Latest Crypto News</h2>
        {news.length > 0 ? (
          news.map((n) => (
            <div
              key={n.id}
              style={{
                background: "#111",
                padding: "10px",
                margin: "10px 0",
                borderRadius: "10px",
              }}
            >
              <h3>{n.title}</h3>
              <p>{n.body.slice(0, 120)}...</p>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "gold" }}
              >
                Read more →
              </a>
            </div>
          ))
        ) : (
          <p>Loading news...</p>
        )}
      </section>

      <section style={{ marginTop: "30px" }}>
        <h2>💰 Top Cryptos</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          {coins.map((coin) => (
            <div
              key={coin.id}
              style={{
                background: "#111",
                borderRadius: "10px",
                padding: "15px",
                textAlign: "center",
              }}
            >
              <img
                src={coin.image}
                alt={coin.name}
                width="40"
                height="40"
                style={{ marginBottom: "10px" }}
              />
              <h3>{coin.name}</h3>
              <p>${coin.current_price}</p>
              <p
                style={{
                  color: coin.price_change_percentage_24h > 0 ? "lime" : "red",
                }}
              >
                {coin.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
