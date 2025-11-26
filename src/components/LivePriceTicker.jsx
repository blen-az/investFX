import React, { useEffect, useState } from 'react';
import './LivePriceTicker.css';

export default function LivePriceTicker() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch top cryptocurrencies
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
                );
                const data = await response.json();

                const formattedPrices = data.map(coin => ({
                    id: coin.id,
                    symbol: coin.symbol.toUpperCase(),
                    name: coin.name,
                    price: coin.current_price,
                    change: coin.price_change_percentage_24h,
                    image: coin.image
                }));

                setPrices(formattedPrices);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching prices:', error);
                setLoading(false);
            }
        };

        fetchPrices();

        // Update prices every 30 seconds
        const interval = setInterval(fetchPrices, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="price-ticker">
                <div className="ticker-content">
                    <div className="ticker-item skeleton">Loading prices...</div>
                </div>
            </div>
        );
    }

    // Duplicate prices for seamless loop
    const duplicatedPrices = [...prices, ...prices];

    return (
        <div className="price-ticker">
            <div className="ticker-content">
                {duplicatedPrices.map((coin, index) => (
                    <div key={`${coin.id}-${index}`} className="ticker-item">
                        <img src={coin.image} alt={coin.name} className="ticker-icon" />
                        <span className="ticker-symbol">{coin.symbol}</span>
                        <span className="ticker-price">
                            ${coin.price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                        <span className={`ticker-change ${coin.change >= 0 ? 'positive' : 'negative'}`}>
                            {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
