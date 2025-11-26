import React from "react";

const transactions = [
  { id: 1, type: "Deposit", amount: "250 USDT", date: "2025-11-10" },
  { id: 2, type: "Trade", amount: "-25 USDT", date: "2025-11-11" },
];

export default function Transactions() {
  return (
    <div className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-xl border border-yellow-600">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Transaction History</h2>
      <table className="w-full text-gray-300">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-2 text-left">Type</th>
            <th className="py-2 text-left">Amount</th>
            <th className="py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/40">
              <td className="py-2">{t.type}</td>
              <td className="py-2">{t.amount}</td>
              <td className="py-2">{t.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
