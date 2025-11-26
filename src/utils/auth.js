// src/utils/auth.js
// Client-side account & referral manager (localStorage). NOT for production use with real money.
// Storage keys intentionally neutral (no "demo" or "test" wording).
const USERS_KEY = "fortunetrade_users_v1";
const SESSION_KEY = "fortunetrade_session_v1";

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

// referral code generator (simple)
function genReferral(email) {
  return (
    email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 6) +
    Math.random().toString(36).slice(2, 6)
  ).toUpperCase();
}

// lightweight (not secure) password encoding for client-only flow
function _encodePass(p) {
  return btoa(p);
}

// Public API:

/**
 * Register a new user.
 * args: { email, password, referralCode (optional) }
 * returns user public info { email, referralCode }
 */
export function register({ email, password, referralCode = null }) {
  const users = _loadUsers();
  if (users[email]) throw new Error("Email already registered");
  const code = genReferral(email);
  const newUser = {
    email,
    pass: _encodePass(password),
    referralCode: code,
    referredBy: referralCode || null,
    createdAt: new Date().toISOString(),
    balanceUSD: 10000, // starting USD balance (you can change)
    balanceCoin: 50, // starting coin balance (optional)
    holdings: 0,
    orders: [],
    trades: [],
    role: "user",
  };

  users[email] = newUser;
  _saveUsers(users);

  // credit referrer if provided
  if (referralCode) {
    for (const e in users) {
      if (users[e].referralCode === referralCode) {
        users[e].balanceCoin = (users[e].balanceCoin || 0) + 5;
        users[e].trades = users[e].trades || [];
        users[e].trades.unshift({
          type: "REFERRAL_BONUS",
          coinAmount: 5,
          time: new Date().toISOString(),
          note: `Referral bonus for inviting ${email}`,
        });
        break;
      }
    }
    _saveUsers(users);
  }

  // auto-login
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  return { email, referralCode: code };
}

/**
 * Login
 */
export function login({ email, password }) {
  const users = _loadUsers();
  const u = users[email];
  if (!u || u.pass !== _encodePass(password)) throw new Error("Invalid credentials");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  return { email, referralCode: u.referralCode };
}

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * current user object (full)
 */
export function currentUser() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!s || !s.email) return null;
    const users = _loadUsers();
    return users[s.email] || null;
  } catch {
    return null;
  }
}

/**
 * adminCredit - admin can credit USD or coin to a user (by email or referralCode)
 * args: { byEmail?, byReferralCode?, coinAmount = 0, usdAmount = 0 }
 */
export function adminCredit({ byEmail, byReferralCode, coinAmount = 0, usdAmount = 0 }) {
  const users = _loadUsers();
  if (byEmail) {
    const u = users[byEmail];
    if (!u) throw new Error("User not found");
    u.balanceCoin = (u.balanceCoin || 0) + coinAmount;
    u.balanceUSD = (u.balanceUSD || 0) + usdAmount;
    u.trades = u.trades || [];
    u.trades.unshift({
      type: "ADMIN_CREDIT",
      coinAmount,
      usdAmount,
      time: new Date().toISOString(),
    });
    _saveUsers(users);
    return u;
  }
  if (byReferralCode) {
    for (const e in users) {
      if (users[e].referralCode === byReferralCode) {
        users[e].balanceCoin = (users[e].balanceCoin || 0) + coinAmount;
        users[e].balanceUSD = (users[e].balanceUSD || 0) + usdAmount;
        users[e].trades.unshift({
          type: "ADMIN_CREDIT",
          coinAmount,
          usdAmount,
          time: new Date().toISOString(),
        });
        _saveUsers(users);
        return users[e];
      }
    }
    throw new Error("Referral code not found");
  }
  throw new Error("Provide byEmail or byReferralCode");
}

/**
 * Update user record (partial). Returns updated user.
 */
export function updateUser(email, patch) {
  const users = _loadUsers();
  const u = users[email];
  if (!u) throw new Error("User not found");
  users[email] = { ...u, ...patch };
  _saveUsers(users);
  return users[email];
}
