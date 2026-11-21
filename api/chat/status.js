import { loadIndex } from '../../server/rag/store.js';

// The page only needs to know whether the assistant exists.
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ready: !!loadIndex() });
}
