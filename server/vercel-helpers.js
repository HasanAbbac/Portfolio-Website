// Shared helpers for the Vercel serverless functions in /api. They reuse the same RAG and mail code as server/index.js.
// Limits live in memory, so they apply per warm function instance (good enough to stop casual abuse on a portfolio).
const buckets = new Map();

export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  return (typeof xff === 'string' ? xff.split(',')[0].trim() : '') || req.socket?.remoteAddress || 'unknown';
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
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
