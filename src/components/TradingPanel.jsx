import React, { useState } from "react";

const TradingPanel = ({ coin, livePrice }) => {
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState("buy");

  const placeOrder = () => {
    alert(
      `${side.toUpperCase()} ${amount} ${coin.symbol.toUpperCase()} at $${livePrice}`
    );
  };

  return (
    <div
      style={{
        background: "#111",
        padding: 20,
        borderRadius: 10,
      }}
    >
      <h3>Trade {coin.name}</h3>

      <div style={{ marginTop: 15 }}>
        <button
          onClick={() => setSide("buy")}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            background: side === "buy" ? "lime" : "#222",
            color: "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Buy
        </button>

        <button
          onClick={() => setSide("sell")}
          style={{
            padding: "10px 20px",
            background: side === "sell" ? "red" : "#222",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Sell
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <p>Price: ${livePrice?.toLocaleString()}</p>
      </div>

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 15,
          borderRadius: 6,
          border: "1px solid #444",
          background: "#000",
          color: "white",
        }}
      />

      <button
        onClick={placeOrder}
        style={{
          marginTop: 20,
          width: "100%",
          padding: 12,
          background: side === "buy" ? "lime" : "red",
          border: "none",
          borderRadius: 6,
          color: side === "buy" ? "black" : "white",
          cursor: "pointer",
        }}
      >
        Confirm Order
      </button>
    </div>
  );
};

export default TradingPanel;
