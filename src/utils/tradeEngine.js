// src/utils/tradeEngine.js
// Simple in-browser order engine & ledger. Storage keys neutral.
const ORDERS_KEY = "fortunetrade_orders_v1";
const TRADES_KEY = "fortunetrade_trades_v1";
const PRICE_KEY = "fortunetrade_price_v1";
const USERS_KEY = "fortunetrade_users_v1";

function _loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function _saveOrders(o) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
}
function _loadTrades() {
  try {
    return JSON.parse(localStorage.getItem(TRADES_KEY) || "[]");
  } catch {
    return [];
  }
}
function _saveTrades(t) {
  localStorage.setItem(TRADES_KEY, JSON.stringify(t));
}
function _loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function _saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function uid() {
  return Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

/**
 * placeOrder({ email, type: 'market'|'limit'|'stop', side:'buy'|'sell', amountUsd, price?, stop? })
 * If market -> executes immediately at getMarketPriceNow()
 * If limit/stop -> stored in orderbook
 */
export function placeOrder(order) {
  const users = _loadUsers();
  const u = users[order.email];
  if (!u) throw new Error("User not found");

  if (order.type === "market") {
    const price = getMarketPriceNow();
    return _executeTrade(order.email, order.side, order.amountUsd, price);
  }

  const o = {
    id: uid(),
    email: order.email,
    type: order.type,
    side: order.side,
    amountUsd: order.amountUsd,
    price: order.price || null,
    stop: order.stop || null,
    createdAt: new Date().toISOString(),
  };
  const orders = _loadOrders();
  orders.unshift(o);
  _saveOrders(orders);
  return { order: o };
}

/**
 * cancelOrder(id, email) - removes order; returns { cancelled: true/false }
 */
export function cancelOrder(id, email) {
  let orders = _loadOrders();
  const before = orders.length;
  orders = orders.filter((o) => o.id !== id || (email && o.email !== email));
  _saveOrders(orders);
  return { cancelled: before !== orders.length };
}

/**
 * tryMatchOrders(currentPrice) - iterate stored orders and execute those that trigger
 * Returns array of executed trades info
 */
export function tryMatchOrders(currentPrice) {
  const orders = _loadOrders();
  const remaining = [];
  const executed = [];

  orders.forEach((o) => {
    let match = false;
    if (o.type === "limit") {
      if (o.side === "buy" && currentPrice <= o.price) match = true;
      if (o.side === "sell" && currentPrice >= o.price) match = true;
    }
    if (o.type === "stop") {
      if (o.side === "sell" && currentPrice <= o.stop) match = true;
      if (o.side === "buy" && currentPrice >= o.stop) match = true;
    }

    if (match) {
      try {
        const t = _executeTrade(o.email, o.side, o.amountUsd, currentPrice, true);
        executed.push(t);
      } catch (e) {
        // if execution fails (insufficient funds), skip and keep order
        remaining.push(o);
      }
    } else {
      remaining.push(o);
    }
  });

  _saveOrders(remaining);
  return executed;
}

/**
 * _executeTrade(email, side, amountUsd, price, auto=false)
 * Updates user balances and records trade
 */
function _executeTrade(email, side, amountUsd, price, auto = false) {
  const users = _loadUsers();
  const u = users[email];
  if (!u) throw new Error("User not found");

  const qty = +(amountUsd / price);
  if (side === "buy") {
    if ((u.balanceUSD || 0) < amountUsd) throw new Error("Insufficient USD balance");
    u.balanceUSD = +(u.balanceUSD - amountUsd);
    u.holdings = +( (u.holdings || 0) + qty );
  } else {
    if ((u.holdings || 0) < qty) throw new Error("Insufficient holdings");
    u.holdings = +(u.holdings - qty);
    u.balanceUSD = +(u.balanceUSD + amountUsd);
  }

  users[email] = u;
  _saveUsers(users);

  const trade = {
    id: uid(),
    time: new Date().toISOString(),
    email,
    side,
    usd: amountUsd,
    qty,
    price,
    auto,
  };

  const trades = _loadTrades();
  trades.unshift(trade);
  _saveTrades(trades);

  // also append to user's trade list
  u.trades = u.trades || [];
  u.trades.unshift(trade);
  _saveUsers(users);

  return trade;
}

/**
 * getMarketPriceNow() - returns a price number, persisted in localStorage to keep continuity
 * You can replace internal randomness by calling real price APIs if you want.
 */
export function getMarketPriceNow() {
  const last = Number(localStorage.getItem(PRICE_KEY) || 100);
  // small random walk
  const next = +(last * (1 + (Math.random() - 0.5) / 200)).toFixed(2);
  localStorage.setItem(PRICE_KEY, String(next));
  return next;
}

/**
 * setMarketPrice(val) - allow admin or price feed to set current price
 */
export function setMarketPrice(val) {
  localStorage.setItem(PRICE_KEY, String(val));
}

/**
 * helpers to read orders/trades
 */
export function getOpenOrders() {
  return _loadOrders();
}
export function getTradeHistory() {
  return _loadTrades();
}
