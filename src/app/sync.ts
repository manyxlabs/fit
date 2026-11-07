import { openDB } from 'idb';
import { useSyncExternalStore } from 'react';
import { b64, unb64 } from '../../worker/b64';
import { MAX_BLOB, MAX_REQUEST, newer, type Pulled, type Row } from '../../worker/protocol';
import { db, STORES } from './db';

// End-to-end encrypted sync of every store but photos between one person's devices. The pairing secret is
// 256 random bits carried only in a link's fragment, which browsers never send to a server, or
// in its QR code. From it come the room id and access token the server sees, and the encryption
// and record id keys it never does. Each record travels alone, encrypted, under an id the server
// cannot work back to a store or key; the latest version of a record wins (see worker/sync.ts).

// Photos stay on the device they were taken on: they are Blobs, which JSON cannot carry, and far
// larger than a sync record may be.
type Store = Exclude<(typeof STORES)[number], 'photos'>;
const SYNCED = STORES.filter((s): s is Store => s !== 'photos');
type Binding = { secret: string; dev: string; cursor: number; last?: number };
/**
 * What this device knows of a record: its local key, a hash of its content (null once deleted),
 * its version, and whether that version still has to be sent.
 */
type Meta = { id: string; store: Store; key: IDBValidKey | undefined; hash: number | null; at: number; dev: string; dirty: 0 | 1 };
/** A record as encrypted: its store, its key unless the store numbers its own, and its content unless deleted. */
type Payload = { s: Store; k?: IDBValidKey; v?: unknown };
type Keys = { room: string; auth: string; key: CryptoKey; ids: CryptoKey };

// Apart from the app's database, so a backup never carries the secret and a restore never drops it.
const local = openDB('fit-sync', 1, {
  upgrade(d) {
    d.createObjectStore('state');
    d.createObjectStore('records', { keyPath: 'id' });
  },
});

const text = new TextEncoder();
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

async function derive(secret: string): Promise<Keys> {
  const base = await crypto.subtle.importKey('raw', unb64(secret), 'HKDF', false, ['deriveKey', 'deriveBits']);
  const params = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: text.encode(info) });
  const [room, auth, key, ids] = await Promise.all([
    crypto.subtle.deriveBits(params('fit sync room'), base, 128),
    crypto.subtle.deriveBits(params('fit sync access'), base, 256),
    crypto.subtle.deriveKey(params('fit sync encryption'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']),
    crypto.subtle.deriveKey(params('fit sync record ids'), base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']),
  ]);
  return { room: b64(new Uint8Array(room)), auth: b64(new Uint8Array(auth)), key, ids };
}

/** The same store and key give the same id on every device, so a day logged on two merges into one record. */
const idFor = async (keys: Keys, store: Store, key: IDBValidKey) =>
  b64(new Uint8Array(await crypto.subtle.sign('HMAC', keys.ids, text.encode(JSON.stringify([store, key])))).subarray(0, 16));

// The id and version are bound to the ciphertext, so the server cannot move a record or pass an old one off as new.
const aad = (r: Pick<Row, 'id' | 'at' | 'dev'>) => text.encode(`${r.id}.${r.at}.${r.dev}`);
async function seal(keys: Keys, r: Omit<Row, 'data'>, p: Payload) {
  const iv = random(12);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(r) }, keys.key, text.encode(JSON.stringify(p))));
  const out = new Uint8Array(12 + sealed.byteLength);
  out.set(iv);
  out.set(sealed, 12);
  return out;
}
async function open(keys: Keys, r: Row): Promise<Payload> {
  const data = unb64(r.data);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.slice(0, 12), additionalData: aad(r) }, keys.key, data.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

/** cyrb53: synchronous, as no other promise may be awaited inside an IndexedDB transaction. Only tells versions apart. */
function hash(s: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** A record's content without the number its store gave it here, which another device numbers its own way. */
function content(value: unknown, ownKey: string | null) {
  if (!ownKey) return value;
  const { [ownKey]: _, ...rest } = value as Record<string, unknown>;
  return rest;
}
const slot = (store: string, key: IDBValidKey) => `${store}\0${JSON.stringify(key)}`;
/** The key path of a store that numbers its own records, else null. */
const ownKey = (s: { autoIncrement: boolean; keyPath: string | string[] | null }) => (s.autoIncrement ? (s.keyPath as string) : null);

/** Notes every record added, changed or deleted here since the last look, with the time it was noticed. */
async function scan(keys: Keys, dev: string) {
  const metas: Meta[] = await (await local).getAll('records');
  const byId = new Map(metas.map((m) => [m.id, m]));
  const live = new Map(metas.filter((m) => m.hash !== null).map((m) => [slot(m.store, m.key!), m]));
  const tx = (await db).transaction(SYNCED);
  const stores = await Promise.all(
    SYNCED.map(async (name) => {
      const s = tx.objectStore(name);
      return { name, own: ownKey(s), keys: await s.getAllKeys(), values: (await s.getAll()) as unknown[] };
    }),
  );
  const now = Date.now();
  const seen = new Set<string>();
  const changes: Meta[] = [];
  const version = (m?: Meta) => ({ at: Math.max(now, (m?.at ?? 0) + 1), dev, dirty: 1 as const });
  for (const { name, own, keys: list, values } of stores)
    for (const [i, key] of list.entries()) {
      // A setting cleared by writing undefined is as good as deleted.
      if (values[i] === undefined) continue;
      const h = hash(JSON.stringify(content(values[i], own)));
      const known = live.get(slot(name, key));
      if (known) seen.add(known.id);
      if (known?.hash === h) continue;
      const id = known?.id ?? (own ? b64(random(16)) : await idFor(keys, name, key));
      changes.push({ id, store: name, key, hash: h, ...version(byId.get(id)) });
    }
  for (const m of live.values()) if (!seen.has(m.id)) changes.push({ ...m, hash: null, ...version(m) });
  if (changes.length) await put(changes);
}

async function put(metas: Meta[]) {
  const tx = (await local).transaction('records', 'readwrite');
  await Promise.all([...metas.map((m) => tx.store.put(m)), tx.done]);
}

/** Changes still to send, as many as fit one request; `rest` says whether more are waiting. */
async function outgoing(keys: Keys) {
  const dirty = ((await (await local).getAll('records')) as Meta[]).filter((m) => m.dirty);
  const d = await db;
  const rows: Row[] = [];
  const sent: Meta[] = [];
  let size = 0;
  let tooLarge = false;
  for (const m of dirty) {
    const s = d.transaction(m.store).store;
    const own = ownKey(s);
    const value = m.hash === null ? undefined : await s.get(m.key as never);
    const p: Payload = { s: m.store, ...(own ? {} : { k: m.key }), ...(value === undefined ? {} : { v: content(value, own) }) };
    const data = await seal(keys, m, p);
    if (data.byteLength > MAX_BLOB) {
      tooLarge = true;
      continue;
    }
    // Room left for base64 and the JSON around it.
    if (size + data.byteLength > MAX_REQUEST / 2) return { rows, sent, rest: true, tooLarge };
    size += data.byteLength;
    rows.push({ id: m.id, at: m.at, dev: m.dev, data: b64(data) });
    sent.push(m);
  }
  return { rows, sent, rest: false, tooLarge };
}

/** Stores the newer versions others sent; returns whether anything here changed. */
async function apply(keys: Keys, rows: Row[]) {
  const store = await local;
  const incoming: { r: Row; m?: Meta; p: Payload }[] = [];
  for (const r of rows) {
    const m: Meta | undefined = await store.get('records', r.id);
    if (m && !newer(r, m)) continue;
    try {
      const p = await open(keys, r);
      // A store from a newer version of the app, which this one cannot hold.
      if (SYNCED.includes(p.s)) incoming.push({ r, m, p });
    } catch {
      // Not sealed with this room's key, so not from one of this person's devices.
    }
  }
  if (!incoming.length) return false;
  const tx = (await db).transaction(SYNCED, 'readwrite');
  const metas: Meta[] = [];
  for (const { r, m, p } of incoming) {
    const s = tx.objectStore(p.s);
    const own = ownKey(s);
    const alive = m && m.hash !== null;
    let key = own ? (alive ? m.key : undefined) : p.k;
    if (key !== undefined) {
      const current: unknown = await s.get(key as never);
      // Changed here since the last scan: that edit is the newer, and the next scan sends it.
      if ((current === undefined ? null : hash(JSON.stringify(content(current, own)))) !== (alive ? m.hash : null)) continue;
    }
    const base = { id: r.id, store: p.s, at: r.at, dev: r.dev, dirty: 0 as const };
    if (p.v === undefined) {
      if (key !== undefined) await s.delete(key as never);
      metas.push({ ...base, key, hash: null });
      continue;
    }
    const value = own && key !== undefined ? { ...(p.v as object), [own]: key } : p.v;
    if (own || s.keyPath) key = await s.put(value as never);
    else await s.put(value as never, key as never);
    metas.push({ ...base, key, hash: hash(JSON.stringify(content(value, own))) });
  }
  await tx.done;
  await put(metas);
  return metas.length > 0;
}

/** `on` is undefined until this device's pairing has been read. */
export type SyncState = { on?: boolean; link?: string; status: 'idle' | 'syncing' | 'offline' | 'error'; last?: number; problem?: string };
let state: SyncState = { status: 'idle' };
const listeners = new Set<() => void>();
const set = (s: Partial<SyncState>) => {
  state = { ...state, ...s };
  for (const l of listeners) l();
};
export const useSyncState = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );

const LINK = /^#join=([\w-]{43})$/;
export const linkFor = (secret: string) => `${location.origin}/app/#join=${secret}`;
export const secretIn = (hash: string) => LINK.exec(hash)?.[1];

const binding = async (): Promise<Binding | undefined> => (await local).get('state', 'binding');
const bind = async (b: Binding) => void (await local).put('state', b, 'binding');

let onRemote = () => {};
let timer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;
let again = false;

/** Runs one sync at a time across every tab of the app, as they share one database. */
const locked = (fn: () => Promise<void>) => (navigator.locks ? navigator.locks.request('fit-sync', fn) : fn());

function soon(ms: number) {
  clearTimeout(timer);
  timer = setTimeout(() => void run(), ms);
}

async function run() {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await locked(cycle);
    } while (again);
  })().finally(() => (running = null));
  return running;
}

async function cycle() {
  const b = await binding();
  if (!b) return;
  const keys = await derive(b.secret);
  await scan(keys, b.dev);
  if (!navigator.onLine) return set({ status: 'offline' });
  set({ status: 'syncing' });
  try {
    for (let more = true; more; ) {
      const out = await outgoing(keys);
      const res = await fetch(`/api/sync/${keys.room}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${keys.auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: b.cursor, put: out.rows }),
      });
      if (res.status === 410) {
        await forget();
        return set({ problem: 'Sync was turned off on another device. Everything on this device is still here.' });
      }
      if (!res.ok) throw new Error(PROBLEMS[res.status] ?? 'Sync failed. It will try again in a minute.');
      const pulled: Pulled = await res.json();
      await put(out.sent.map((m) => ({ ...m, dirty: 0 })));
      if (await apply(keys, pulled.rows)) onRemote();
      b.cursor = pulled.seq;
      b.last = Date.now();
      await bind(b);
      if (out.tooLarge) throw new Error('A record is too large to sync.');
      more = pulled.more || out.rest;
    }
    set({ status: 'idle', last: b.last, problem: undefined });
  } catch (e) {
    // fetch rejects with a TypeError only when the network fails.
    if (e instanceof TypeError) return set({ status: 'offline' });
    set({ status: 'error', problem: (e as Error).message });
    soon(60_000);
  }
}

const PROBLEMS: Record<number, string> = {
  403: 'This device is not allowed in the sync room. Remove it and pair again.',
  413: 'Your synced data has reached the 25 MB limit.',
  429: 'Too many sync requests. It will try again in a minute.',
};

/** Starts syncing, if this device is paired, and keeps at it: on changes, on coming back online and on returning to the app. */
export function startSync(refresh: () => void) {
  onRemote = refresh;
  addEventListener('online', () => soon(0));
  addEventListener('focus', () => soon(0));
  // Sent on leaving too, so a change made just before switching apps is not left behind.
  document.addEventListener('visibilitychange', () => soon(0));
  void binding().then((b) => {
    set(b ? { on: true, link: linkFor(b.secret), last: b.last } : { on: false });
    if (b) soon(0);
  });
}

/** After a change here, debounced, so a burst of edits goes out in one request. */
export const scheduleSync = () => state.on && soon(1500);
export const syncNow = () => run();

/** Pairs this device with a new secret; returns once the first sync is done. */
export const turnOn = () => pair(b64(random(32)));

/** Pairs this device with the secret from another's link; what is here merges with what is there. */
export async function pair(secret: string) {
  await locked(async () => {
    const tx = (await local).transaction(['state', 'records'], 'readwrite');
    await Promise.all([tx.objectStore('records').clear(), tx.objectStore('state').put({ secret, dev: b64(random(8)), cursor: 0 } satisfies Binding, 'binding'), tx.done]);
  });
  set({ on: true, link: linkFor(secret), status: 'idle', last: undefined, problem: undefined });
  await run();
}

/** Stops syncing on this device only; the others carry on, and the data here stays. */
async function forget() {
  const tx = (await local).transaction(['state', 'records'], 'readwrite');
  await Promise.all([tx.objectStore('records').clear(), tx.objectStore('state').clear(), tx.done]);
  set({ on: false, link: undefined, status: 'idle', last: undefined });
}
export const removeDevice = () => locked(forget);

/** Deletes the encrypted copy from the server, which ends sync on every device; each keeps its own data. */
export async function turnOff() {
  await locked(async () => {
    const b = await binding();
    if (!b) return;
    const keys = await derive(b.secret);
    const offline = 'Could not reach the server. Try again when online.';
    const res = await fetch(`/api/sync/${keys.room}`, { method: 'DELETE', headers: { Authorization: `Bearer ${keys.auth}` } }).catch(() => {
      throw new Error(offline);
    });
    // Kept paired otherwise: forgetting the secret now would leave the copy on the server with no way to delete it.
    if (!res.ok && res.status !== 410) throw new Error(PROBLEMS[res.status] ?? offline);
    await forget();
  });
}
