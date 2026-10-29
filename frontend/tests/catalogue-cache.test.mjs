import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogueCache } from '../src/services/catalogueCache.js';
test('repeated catalogue reads reuse a fresh result and expire', async () => {
 let time=0, calls=0; const cache=createCatalogueCache({ttl:30,now:()=>time});
 const fetcher=async()=>({version:++calls});
 await cache.load('guest:products',fetcher);
 assert.equal((await cache.load('guest:products',fetcher)).version,1);
 time=31;
 assert.equal((await cache.load('guest:products',fetcher)).version,2);
});
test('simultaneous catalogue requests share one fetch', async () => {
 const cache=createCatalogueCache(); let calls=0;
 const fetcher=async()=>{calls++; return ['products'];};
 await Promise.all([cache.load('a',fetcher),cache.load('a',fetcher)]);
 assert.equal(calls,1);
});
test('different user scopes never reuse each other and explicit retry bypasses cache', async () => {
 const cache=createCatalogueCache();
 await cache.load('admin:products',async()=>['private']);
 assert.equal(cache.peek('guest:products'),undefined);
 assert.deepEqual(await cache.load('admin:products',async()=>['new'],true),['new']);
});
test('failed fetches are retryable and do not poison the cache', async () => {
 const cache=createCatalogueCache();
 await assert.rejects(cache.load('x',async()=>{throw new Error('offline');}));
 assert.equal(cache.peek('x'),undefined);
 assert.deepEqual(await cache.load('x',async()=>['ok']),['ok']);
});
test('cache has a bounded number of catalogue pages', async () => {
 const cache=createCatalogueCache({limit:2});
 for(const key of ['a','b','c']) await cache.load(key,async()=>key);
 assert.equal(cache.peek('a'),undefined);
 assert.equal(cache.peek('c'),'c');
});