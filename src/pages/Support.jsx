import React, { useState } from "react";

export default function Support() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl border border-yellow-600">
      <h2 className="text-2xl text-yellow-400 font-bold mb-4">Support Chat</h2>
      {!submitted ? (
        <form onSubmit={handleSend} className="space-y-4">
          <textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 h-32 rounded bg-black border border-gray-700 text-yellow-400 focus:border-yellow-500"
          />
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded"
          >
            Send Message
          </button>
        </form>
      ) : (
        <div className="text-center text-yellow-300">✅ Message sent! Support will reply soon.</div>
      )}
    </div>
  );
}
