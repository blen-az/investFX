import React, { useEffect, useState } from "react";

function Dashboard() {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin&order=market_cap_desc&per_page=3&page=1&sparkline=false"
        );
        const data = await response.json();
        setCryptoData(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchCrypto();
    const interval = setInterval(fetchCrypto, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center text-white mt-20">Loading...</div>;
  if (error) return <div className="text-center text-red-400 mt-20">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Live Crypto Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cryptoData.map((coin) => (
          <div
            key={coin.id}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:bg-gray-700 transition"
          >
            <img src={coin.image} alt={coin.name} className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">{coin.name}</h2>
            <p className="text-gray-400">{coin.symbol.toUpperCase()}</p>
            <p className="text-2xl font-bold mt-2">${coin.current_price.toLocaleString()}</p>
            <p
              className={`mt-2 ${
                coin.price_change_percentage_24h > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {coin.price_change_percentage_24h.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
