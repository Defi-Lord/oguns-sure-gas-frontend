import assert from 'node:assert/strict';
import test from 'node:test';
import axios, { AxiosError } from 'axios';
import { installSessionInterceptors } from '../lib/api/session-interceptors.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const denied = (config, status = 401) => new AxiosError('Denied', 'ERR_BAD_REQUEST', config, undefined, { status, config });
const success = (config) => ({ data: config.headers.get('Authorization'), status: 200, config });

function fixture(adapter, refresh) {
  let session;
  const signIn = (key) => {
    session = {
      key, accessToken: key + '-access', refreshToken: key + '-refresh',
      setTokens: (tokens) => { session = { ...session, ...tokens }; },
      clearAuth: () => { session = { ...session, key: 'signed-out', accessToken: null, refreshToken: null }; },
    };
  };
  signIn('staff-a');
  const api = axios.create({ adapter });
  installSessionInterceptors(api, () => session, refresh);
  return { api, signIn, current: () => session };
}

test('a delayed 401 from an earlier account cannot trigger a retry under another account', async () => {
  const started = deferred();
  const gate = deferred();
  const seen = [];
  const f = fixture(async (config) => {
    seen.push(config.headers.get('Authorization'));
    started.resolve();
    await gate.promise;
    throw denied(config);
  }, async () => { assert.fail('old request started a refresh'); });
  const request = f.api.patch('/orders/1', { status: 'READY' });
  await started.promise;
  f.signIn('staff-b');
  gate.resolve();
  await assert.rejects(request, axios.isCancel);
  assert.deepEqual(seen, ['Bearer staff-a-access']);
  assert.equal(f.current().key, 'staff-b');
});

for (const late of ['success', 'failure']) {
  test(`a refresh that finishes with ${late} cannot overwrite or sign out a replacement session`, async () => {
    const started = deferred();
    const gate = deferred();
    const f = fixture(async (config) => { throw denied(config); }, async () => {
      started.resolve();
      return gate.promise;
    });
    const request = f.api.get('/orders');
    await started.promise;
    f.signIn('staff-b');
    if (late === 'success') gate.resolve({ accessToken: 'old-rotated', refreshToken: 'old-refresh' });
    else gate.reject(denied(undefined));
    await assert.rejects(request, axios.isCancel);
    assert.equal(f.current().accessToken, 'staff-b-access');
  });
}

test('same-session requests share one refresh and retry normally', async () => {
  let refreshes = 0;
  const f = fixture(async (config) => {
    if (config.headers.get('Authorization') === 'Bearer rotated') return success(config);
    throw denied(config);
  }, async () => {
    refreshes++;
    return { accessToken: 'rotated', refreshToken: 'rotated-refresh' };
  });
  const responses = await Promise.all([f.api.get('/orders'), f.api.get('/deliveries')]);
  assert.deepEqual(responses.map((r) => r.data), ['Bearer rotated', 'Bearer rotated']);
  assert.equal(refreshes, 1);
});

test('a temporary refresh outage preserves the current session', async () => {
  const f = fixture(async (config) => { throw denied(config); }, async () => {
    throw new AxiosError('Offline', 'ERR_NETWORK');
  });
  await assert.rejects(f.api.get('/orders'), { code: 'ERR_NETWORK' });
  assert.equal(f.current().accessToken, 'staff-a-access');
});

test('a successful response from the previous account is discarded after switching', async () => {
  const gate = deferred();
  const f = fixture(async (config) => {
    await gate.promise;
    return success(config);
  }, async () => { assert.fail('unexpected refresh'); });
  const request = f.api.get('/orders');
  f.signIn('staff-b');
  gate.resolve();
  await assert.rejects(request, axios.isCancel);
});

test('an explicitly rejected refresh clears only the current session', async () => {
  const f = fixture(async (config) => { throw denied(config); }, async () => {
    throw denied(undefined);
  });
  await assert.rejects(f.api.get('/orders'), axios.isAxiosError);
  assert.equal(f.current().key, 'signed-out');
});
