const https = require('https');

const BASE = 'https://paper-api.alpaca.markets/v2';
const KEY = process.env.ALPACA_KEY;
const SECRET = process.env.ALPACA_SECRET;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'APCA-API-KEY-ID': KEY,
        'APCA-API-SECRET-KEY': SECRET,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Account ────────────────────────────────────────────────────────────────
async function getAccount() {
  return request('GET', '/account');
}

// ── Positions ─────────────────────────────────────────────────────────────
async function getPositions() {
  return request('GET', '/positions');
}

async function closePosition(symbol) {
  return request('DELETE', `/positions/${symbol}`);
}

// ── Orders ────────────────────────────────────────────────────────────────
async function getOrders(status = 'all', limit = 50) {
  return request('GET', `/orders?status=${status}&limit=${limit}&direction=desc`);
}

async function placeOrder(symbol, qty, side, orderType = 'market', tif = 'day', extra = {}) {
  const body = {
    symbol,
    qty: String(qty),
    side,             // 'buy' | 'sell'
    type: orderType,  // 'market' | 'limit' | 'stop' | 'stop_limit'
    time_in_force: tif,
    ...extra,
  };
  return request('POST', '/orders', body);
}

async function cancelOrder(orderId) {
  return request('DELETE', `/orders/${orderId}`);
}

// ── Portfolio history ──────────────────────────────────────────────────────
async function getPortfolioHistory(period = '1M', timeframe = '1D') {
  return request('GET', `/account/portfolio/history?period=${period}&timeframe=${timeframe}`);
}

module.exports = {
  getAccount,
  getPositions,
  closePosition,
  getOrders,
  placeOrder,
  cancelOrder,
  getPortfolioHistory,
};
