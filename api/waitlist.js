import { processWaitlist } from './waitlist-core.js';

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) return raw.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  try {
    const body = await readBody(req);
    const result = await processWaitlist({
      method: req.method,
      body,
      ip: clientIp(req),
      env: process.env,
      fetch: globalThis.fetch,
    });
    res.status(result.status).json(result.json);
  } catch {
    res.status(400).json({ ok: false, error: 'invalid' });
  }
}
