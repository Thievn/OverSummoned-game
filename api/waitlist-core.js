const ORIGIN_TITLES = {
  hunter: 'Stone Age Hunter',
  legionary: 'Roman Legionary',
  engineer: 'Victorian Engineer',
  gangster: 'Prohibition Gangster',
  paramedic: 'Modern Paramedic',
  office_worker: 'Office Worker',
};

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function bucket() {
  if (!globalThis.__oversummonedRate) globalThis.__oversummonedRate = new Map();
  return globalThis.__oversummonedRate;
}

export function resetWaitlistState() {
  bucket().clear();
}

export function validateEmail(email) {
  if (typeof email !== 'string') return '';
  const value = email.trim().toLowerCase();
  if (value.length < 3 || value.length > 320) return '';
  if (!EMAIL.test(value)) return '';
  return value;
}

function cleanReferrer(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/[\r\n\u0000]/g, '').slice(0, 300);
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed;
}

function allow(map, ip, now) {
  const key = (ip || 'unknown').slice(0, 80);
  const hits = (map.get(key) || []).filter((stamp) => now - stamp < WINDOW_MS);
  if (hits.length >= MAX_HITS) {
    map.set(key, hits);
    return false;
  }
  hits.push(now);
  map.set(key, hits);
  return true;
}

async function callContacts(fetchImpl, key, path, method, payload) {
  const headers = { Authorization: `Bearer ${key}` };
  const init = { method, headers };
  if (payload) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(payload);
  }
  const response = await fetchImpl(`https://api.resend.com${path}`, init);
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text.slice(0, 240) };
    }
  }
  return { ok: response.ok, status: response.status, json };
}

function isDuplicate(status, json) {
  if (status === 409) return true;
  const message = `${json?.message || ''} ${json?.name || ''}`.toLowerCase();
  return message.includes('already exists');
}

function isPropertyError(status, json) {
  if (status !== 400 && status !== 422) return false;
  return JSON.stringify(json || {}).toLowerCase().includes('propert');
}

export async function processWaitlist({
  method,
  body,
  ip,
  env,
  fetch: fetchImpl,
  now = Date.now(),
  rateStore,
}) {
  if (method !== 'POST') return { status: 405, json: { ok: false, error: 'method' } };

  const map = rateStore || bucket();
  if (!allow(map, ip, now)) return { status: 429, json: { ok: false, error: 'rate' } };

  const data = body && typeof body === 'object' ? body : {};
  if (typeof data.fax_number === 'string' && data.fax_number.trim()) {
    return { status: 200, json: { ok: true } };
  }

  const email = validateEmail(data.email);
  if (!email) return { status: 400, json: { ok: false, error: 'invalid' } };

  const backend = env?.WAITLIST_BACKEND;
  const key = env?.RESEND_WAITLIST_API_KEY;
  const segmentId = env?.RESEND_WAITLIST_SEGMENT_ID;
  if (backend !== 'resend' || !key || !segmentId) {
    return { status: 503, json: { ok: false, error: 'down' } };
  }

  const properties = {};
  const originTitle = ORIGIN_TITLES[data.origin] || '';
  const referrer = cleanReferrer(data.referrer);
  if (originTitle) properties.origin = originTitle;
  if (referrer) properties.referrer = referrer;

  const payloadFor = (withProperties) => {
    const payload = {
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    };
    if (withProperties && Object.keys(properties).length) payload.properties = properties;
    return payload;
  };

  let result = await callContacts(fetchImpl, key, '/contacts', 'POST', payloadFor(true));
  if (!result.ok && isPropertyError(result.status, result.json) && payloadFor(true).properties) {
    result = await callContacts(fetchImpl, key, '/contacts', 'POST', payloadFor(false));
  }

  if (result.ok) return { status: 200, json: { ok: true } };

  if (isDuplicate(result.status, result.json)) {
    const encoded = encodeURIComponent(email);
    if (Object.keys(properties).length) {
      await callContacts(fetchImpl, key, `/contacts/${encoded}`, 'PATCH', { properties });
    }
    await callContacts(
      fetchImpl,
      key,
      `/contacts/${encoded}/segments/${encodeURIComponent(segmentId)}`,
      'POST',
    );
    return { status: 200, json: { ok: true } };
  }

  console.error('waitlist save failed', result.status);
  return { status: 502, json: { ok: false, error: 'down' } };
}
