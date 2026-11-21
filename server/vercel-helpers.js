// Shared helpers for the Vercel serverless functions in /api. They reuse the same RAG and mail code as server/index.js.
// Limits live in memory, so they apply per warm function instance (good enough to stop casual abuse on a portfolio).
const buckets = new Map();

// On Vercel the platform sets x-vercel-forwarded-for (a visitor cannot choose it); x-forwarded-for is the fallback elsewhere.
export function clientIp(req) {
  for (const h of ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for']) {
    const v = req.headers[h];
    if (typeof v === 'string' && v.trim()) return v.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Same 10 kB cap as the Express server: a visitor's message never needs more, so bigger bodies are refused up front.
export const MAX_BODY_BYTES = 10 * 1024;
export function tooLarge(req) {
  const n = Number(req.headers['content-length']);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}

// returns true when the request is allowed
export function allow(key, limit, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) { buckets.set(key, hits); return false; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.length || v[v.length - 1] < now - windowMs) buckets.delete(k);
  return true;
}

export const num = (name, fallback) => { const n = Number(process.env[name]); return Number.isFinite(n) && n > 0 ? n : fallback; };

export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { if (req.body.length > MAX_BODY_BYTES) return {}; try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
