import test from 'node:test';
import assert from 'node:assert/strict';

import { getSafeBaseUrl, waitForServer } from './capture-mock.mjs';

test('getSafeBaseUrl returns the allowlisted local URL', () => {
  const url = getSafeBaseUrl();

  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '4300');
  assert.equal(url.toString(), 'http://127.0.0.1:4300/');
});

test('waitForServer retries until receiving an ok response', async () => {
  const calls = [];
  let attempts = 0;

  await waitForServer(10_000, {
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      attempts += 1;
      return { ok: attempts >= 3 };
    },
    sleepImpl: async () => {},
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, 'http://127.0.0.1:4300/');
  assert.equal(calls[0].init.method, 'GET');
});

test('waitForServer throws timeout when server never responds ok', async () => {
  let nowValue = 0;

  await assert.rejects(
    waitForServer(2_000, {
      fetchImpl: async () => ({ ok: false }),
      sleepImpl: async () => {},
      now: () => {
        nowValue += 1_000;
        return nowValue;
      },
    }),
    /Timeout esperando el servidor en http:\/\/127\.0\.0\.1:4300\//,
  );
});
