import assert from 'node:assert/strict';
import test from 'node:test';
import { processWaitlist, validateEmail } from '../api/waitlist-core.js';
import { missingPage } from '../api/waitlist.js';

const env = {
  WAITLIST_BACKEND: 'resend',
  RESEND_WAITLIST_API_KEY: 're_test_key',
  RESEND_WAITLIST_SEGMENT_ID: 'seg_test',
};

function mockFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });
    return handler(calls.at(-1), calls);
  };
  return { fetchImpl, calls };
}

function jsonResponse(status, json) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(json),
  };
}

async function post(body, fetchImpl, extra = {}) {
  return processWaitlist({
    method: 'POST',
    body,
    ip: '203.0.113.4',
    env,
    fetch: fetchImpl,
    rateStore: new Map(),
    ...extra,
  });
}

test('rejects a sloppy address', () => {
  assert.equal(validateEmail('not-an-email'), '');
  assert.equal(validateEmail('a@b'), '');
  assert.equal(validateEmail('  Hero@Aldermere.example '), 'hero@aldermere.example');
});

test('saves a contact on the contacts endpoint only', async () => {
  const { fetchImpl, calls } = mockFetch(async () => jsonResponse(201, { id: 'c1' }));
  const result = await post(
    {
      email: 'Hero@Example.com',
      origin: 'legionary',
      referrer: 'https://town.example/gate',
      fax_number: '',
    },
    fetchImpl,
  );
  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/contacts');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].body.email, 'hero@example.com');
  assert.equal(calls[0].body.properties.origin, 'Roman Legionary');
  assert.equal(calls[0].body.properties.referrer, 'https://town.example/gate');
  assert.deepEqual(calls[0].body.segments, [{ id: 'seg_test' }]);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test_key');
  assert.equal(calls[0].url.includes('/emails'), false);
});

test('drops unknown properties and retries the contact', async () => {
  const { fetchImpl, calls } = mockFetch(async (_call, all) => {
    if (all.length === 1) return jsonResponse(422, { message: 'Unknown property origin' });
    return jsonResponse(201, { id: 'c2' });
  });
  const result = await post({ email: 'a@b.co', origin: 'hunter' }, fetchImpl);
  assert.equal(result.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.properties, undefined);
  assert.ok(calls[1].body.segments);
});

test('treats a duplicate as filed and still attaches the segment', async () => {
  const { fetchImpl, calls } = mockFetch(async (_call, all) => {
    if (all.length === 1) return jsonResponse(409, { message: 'Contact already exists' });
    return jsonResponse(200, { id: 'ok' });
  });
  const result = await post(
    { email: 'again@example.com', origin: 'gangster', referrer: 'https://ref.example' },
    fetchImpl,
  );
  assert.equal(result.status, 200);
  assert.equal(calls[1].init.method, 'PATCH');
  assert.match(calls[1].url, /\/contacts\/again%40example.com$/);
  assert.equal(calls[1].body.unsubscribed, undefined);
  assert.equal(calls[2].init.method, 'POST');
  assert.match(calls[2].url, /\/contacts\/again%40example.com\/segments\/seg_test$/);
});

test('honeypot pretends to succeed and does not call Resend', async () => {
  let called = false;
  const result = await post({ email: 'bot@example.com', fax_number: 'spam' }, async () => {
    called = true;
    return jsonResponse(201, {});
  });
  assert.equal(result.status, 200);
  assert.equal(called, false);
});

test('rate limit trips before another save', async () => {
  const map = new Map();
  const fetchImpl = async () => jsonResponse(201, { id: 'c' });
  for (let i = 0; i < 5; i += 1) {
    const ok = await processWaitlist({
      method: 'POST',
      body: { email: `p${i}@example.com` },
      ip: '198.51.100.8',
      env,
      fetch: fetchImpl,
      rateStore: map,
      now: 1_000_000 + i,
    });
    assert.equal(ok.status, 200);
  }
  const blocked = await processWaitlist({
    method: 'POST',
    body: { email: 'p6@example.com' },
    ip: '198.51.100.8',
    env,
    fetch: fetchImpl,
    rateStore: map,
    now: 1_000_100,
  });
  assert.equal(blocked.status, 429);
});

test('refuses anything but the contacts backend', async () => {
  const result = await processWaitlist({
    method: 'POST',
    body: { email: 'a@b.co' },
    ip: '1',
    env: { WAITLIST_BACKEND: 'other' },
    fetch: async () => jsonResponse(201, {}),
    rateStore: new Map(),
  });
  assert.equal(result.status, 503);
});

test('a browser visit does not describe the plumbing', () => {
  const page = missingPage();
  assert.match(page, /OverSummoned/);
  assert.equal(/\b(resend|vercel|endpoint|segment|backend|supabase|api|method)\b/i.test(page), false);
});

test('get is not a filing method', async () => {
  const result = await processWaitlist({
    method: 'GET',
    body: {},
    ip: '1',
    env,
    fetch: async () => jsonResponse(200, {}),
    rateStore: new Map(),
  });
  assert.equal(result.status, 405);
});
