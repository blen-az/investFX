// src/services/priceService.js
/**
 * Service to fetch live crypto prices from public APIs
 * with caching and fallback support.
 */

const CACHE_DURATION = 15000; // 15 seconds
let priceCache = {
    data: null,
    timestamp: 0
};

// Primary API (CoinGecko)
// Primary API (CoinGecko)
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,dogecoin,polkadot,litecoin,chainlink&vs_currencies=usd";

// Backup API (CoinCap)
const COINCAP_API = "https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,dogecoin,polkadot,litecoin,chainlink";

/**
 * Get current prices for major cryptocurrencies
 * @returns {Promise<Object>} Object with symbol as key and USD price as value
 */
export async function getCryptoPrices() {
    const now = Date.now();

    // Return cached data if valid
    if (priceCache.data && (now - priceCache.timestamp < CACHE_DURATION)) {
        return priceCache.data;
    }

    try {
        // Try CoinGecko first
        const response = await fetch(COINGECKO_API);
        if (!response.ok) throw new Error("CoinGecko failed");

        const data = await response.json();
        const prices = {
            BTC: data.bitcoin.usd,
            ETH: data.ethereum.usd,
            USDT: data.tether.usd,
            SOL: data.solana.usd,
            BNB: data.binancecoin.usd,
            XRP: data.ripple.usd,
            ADA: data.cardano.usd,
            DOGE: data.dogecoin.usd,
            DOT: data.polkadot.usd,
            LTC: data.litecoin.usd,
            LINK: data.chainlink.usd
        };

        priceCache = { data: prices, timestamp: now };
        return prices;
    } catch (error) {
        console.warn("CoinGecko price fetch failed, trying backup...", error);

        try {
            // Fallback to CoinCap
            const response = await fetch(COINCAP_API);
            if (!response.ok) throw new Error("CoinCap failed");

            const json = await response.json();
            const prices = {};

            json.data.forEach(asset => {
                const symbol = asset.symbol.toUpperCase();
                prices[symbol] = parseFloat(asset.priceUsd);
            });

            // Ensure USDT is 1 if missing or slightly off
            if (!prices.USDT) prices.USDT = 1;

            priceCache = { data: prices, timestamp: now };
            return prices;
        } catch (backupError) {
            console.error("All price APIs failed", backupError);
            // Return defaults if everything fails to avoid crashing
            return {
                BTC: 42000,
                ETH: 2200,
                USDT: 1,
                SOL: 100,
                BNB: 300
            };
        }
    }
}

/**
 * Get price for a specific symbol
 * @param {string} symbol 
 * @returns {Promise<number>}
 */
export async function getPriceBySymbol(symbol) {
    const prices = await getCryptoPrices();
    return prices[symbol.toUpperCase()] || 0;
}
