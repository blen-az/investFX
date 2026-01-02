import React, { useMemo } from 'react';
import './OrderBook.css';

export default function OrderBook({ currentPrice }) {
  // Generate some mock order book data around the current price
  const { asks, bids } = useMemo(() => {
    const price = parseFloat(currentPrice) || 4351.87;
    const askList = [];
    const bidList = [];

    // Generate Asks (Red - Sell Orders) - Higher than current price
    for (let i = 0; i < 5; i++) {
      const p = price + (Math.random() * 2);
      const size = (Math.random() * 0.5 + 0.01).toFixed(4); // e.g. 0.032
      askList.push({ price: p.toFixed(4), size });
    }
    // Sort asks ascending (lowest ask at bottom)
    askList.sort((a, b) => b.price - a.price); // Visual order: High top, Low bottom? 
    // Usually Asks are stacked: Lowest Ask close to spread.
    // In UI: Asks top, Current Price middle, Bids bottom.
    // Asks need explicitly reversed or sorted ascending?
    // Let's sort Descending for the list (Highest price at top).

    // Generate Bids (Green - Buy Orders) - Lower than current price
    for (let i = 0; i < 5; i++) {
      const p = price - (Math.random() * 2);
      const size = (Math.random() * 20 + 5).toFixed(4); // e.g. 18.0755
      bidList.push({ price: p.toFixed(4), size });
    }
    // Sort bids descending (Highest bid at top)
    bidList.sort((a, b) => b.price - a.price);

    return { asks: askList, bids: bidList };
  }, [currentPrice]);

  return (
    <div className="order-book">
      {/* Header */}
      <div className="ob-header">
        <span>Price</span>
        <span>Number</span>
      </div>

      {/* Asks (Sell) */}
      <div className="ob-list asks">
        {asks.map((ask, idx) => (
          <div key={`ask-${idx}`} className="ob-row">
            <span className="ob-price red">{ask.price}</span>
            <span className="ob-size">{ask.size}</span>
          </div>
        ))}
      </div>

      {/* Current Price Display */}
      <div className="ob-current-price">
        {parseFloat(currentPrice).toFixed(2)}
      </div>

      {/* Bids (Buy) */}
      <div className="ob-list bids">
        {bids.map((bid, idx) => (
          <div key={`bid-${idx}`} className="ob-row">
            <span className="ob-price green">{bid.price}</span>
            <span className="ob-size">{bid.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
