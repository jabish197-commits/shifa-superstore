import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import api, { tokenStore } from '../src/services/api.js';
const memory = () => { const values = new Map(); return { getItem: (k) => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: (k) => values.delete(k) }; };
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();
globalThis.window = new EventTarget();
const failure = (config, status) => Promise.reject(new axios.AxiosError('Request failed', undefined, config, {}, {status, data:{}, config}));
const success = (config, data) => Promise.resolve({status:200, data, config, headers:{}});
test.beforeEach(() => { tokenStore.clear(); });
test('login survives a new tab session and old session tokens migrate', () => {
  sessionStorage.setItem('shifa-auth', JSON.stringify({access:'old',refresh:'refresh'}));
  assert.equal(tokenStore.get().access, 'old');
  assert.equal(sessionStorage.getItem('shifa-auth'), null);
  globalThis.sessionStorage = memory();
  assert.equal(tokenStore.get().refresh, 'refresh');
});
test('explicit logout removes both storage copies', () => {
  tokenStore.set({access:'a',refresh:'r'});
  sessionStorage.setItem('shifa-auth','{}');
  tokenStore.clear();
  assert.equal(tokenStore.get(), null);
});
test('a refresh timeout keeps the login', async () => {
  tokenStore.set({access:'expired',refresh:'valid'});
  api.defaults.adapter = (config) => failure(config,401);
  axios.defaults.adapter = (config) => Promise.reject(new axios.AxiosError('timeout','ECONNABORTED',config));
  await assert.rejects(api.get('accounts/me/'));
  assert.equal(tokenStore.get().refresh, 'valid');
});
test('a server refresh failure keeps the login', async () => {
  tokenStore.set({access:'expired',refresh:'valid'});
  api.defaults.adapter = (config) => failure(config,401);
  axios.defaults.adapter = (config) => failure(config,503);
  await assert.rejects(api.get('accounts/me/'));
  assert.equal(tokenStore.get().refresh, 'valid');
});
test('an invalid refresh token clears the login', async () => {
  tokenStore.set({access:'expired',refresh:'invalid'});
  api.defaults.adapter = (config) => failure(config,401);
  axios.defaults.adapter = (config) => failure(config,401);
  await assert.rejects(api.get('accounts/me/'));
  assert.equal(tokenStore.get(), null);
});
test('concurrent requests rotate once and retry with the new access token', async () => {
  tokenStore.set({access:'expired',refresh:'valid'});
  let refreshes = 0;
  api.defaults.adapter = (config) => config.headers.Authorization === 'Bearer fresh' ? success(config,{ok:true}) : failure(config,401);
  axios.defaults.adapter = async (config) => { refreshes++; await new Promise(resolve=>setTimeout(resolve,10)); return success(config,{access:'fresh',refresh:'rotated'}); };
  const results = await Promise.all([api.get('accounts/me/'),api.get('cart/')]);
  assert.equal(refreshes,1);
  assert.equal(results[1].data.ok,true);
  assert.equal(tokenStore.get().refresh,'rotated');
});
test('an in-flight refresh cannot restore a session after logout', async () => {
  tokenStore.set({access:'expired',refresh:'valid'});
  api.defaults.adapter = (config) => failure(config,401);
  axios.defaults.adapter = async (config) => { tokenStore.clear(); return success(config,{access:'fresh',refresh:'rotated'}); };
  await assert.rejects(api.get('accounts/me/'));
  assert.equal(tokenStore.get(),null);
});