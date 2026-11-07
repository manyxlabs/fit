// Web Push with WebCrypto alone: message encryption (RFC 8291, the aes128gcm coding of RFC 8188)
// and VAPID (RFC 8292), so the Worker needs no Node library.
import { b64, unb64 } from './b64';

type Bytes = Uint8Array<ArrayBuffer>;
export type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
/** base64url: the public key as an uncompressed P-256 point, the private key as its 32-byte scalar. */
export type Vapid = { publicKey: string; privateKey: string };

const text = new TextEncoder();
// Always backed by a plain ArrayBuffer, though the Workers types do not say so.
const utf8 = (s: string) => text.encode(s) as Bytes;
/** One record of 4096 bytes, so a payload must leave room for the delimiter and the tag. */
const RS = 4096;
export const MAX_PAYLOAD = RS - 17;

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/** A P-256 key from its raw forms; WebCrypto imports a private scalar only as a JWK. */
export function importP256(publicRaw: Bytes, d: Bytes | null, name: 'ECDH' | 'ECDSA', usages: ('deriveBits' | 'sign')[]) {
  if (publicRaw.byteLength !== 65 || publicRaw[0] !== 4) throw new Error('Expected an uncompressed P-256 point');
  if (!d) return crypto.subtle.importKey('raw', publicRaw, { name, namedCurve: 'P-256' }, true, usages);
  if (d.byteLength !== 32) throw new Error('Expected a 32-byte private key');
  const jwk = { kty: 'EC', crv: 'P-256', x: b64(publicRaw.subarray(1, 33)), y: b64(publicRaw.subarray(33)), d: b64(d) };
  return crypto.subtle.importKey('jwk', jwk, { name, namedCurve: 'P-256' }, false, usages);
}

// The Workers types name the peer key `$public`, while the runtime, like the standard, reads `public`.
const ecdh = (key: CryptoKey) => ({ name: 'ECDH', public: key }) as unknown as Parameters<SubtleCrypto['deriveBits']>[0];

/** Encrypts with a given salt and sender key pair, so the RFC's test vector can check it; `encrypt` picks fresh ones. */
export async function encryptWith(plaintext: Bytes, ua: { p256dh: Bytes; auth: Bytes }, salt: Bytes, sender: { publicRaw: Bytes; privateKey: CryptoKey }) {
  if (plaintext.byteLength > MAX_PAYLOAD) throw new Error('Push payload too large');
  if (ua.auth.byteLength !== 16 || salt.byteLength !== 16) throw new Error('Expected a 16-byte auth secret and salt');
  const uaKey = await importP256(ua.p256dh, null, 'ECDH', []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits(ecdh(uaKey), sender.privateKey, 256));
  const ikm = await hkdf(ua.auth, secret, concat(utf8('WebPush: info\0'), ua.p256dh, sender.publicRaw), 32);
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // One record, so it ends with the 0x02 delimiter that marks the last.
  const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(plaintext, new Uint8Array([2])));
  const header = new Uint8Array(21);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, RS);
  header[20] = sender.publicRaw.byteLength;
  return concat(header, sender.publicRaw, new Uint8Array(sealed));
}

export async function encrypt(plaintext: Bytes, keys: Subscription['keys']) {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])) as CryptoKeyPair;
  const publicRaw = new Uint8Array((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer);
  return encryptWith(plaintext, { p256dh: unb64(keys.p256dh), auth: unb64(keys.auth) }, crypto.getRandomValues(new Uint8Array(16)), { publicRaw, privateKey: pair.privateKey });
}

/** The Authorization header for a push service: a JWT for its origin, signed with ES256 (raw r||s, as JWS wants). */
export async function vapid(endpoint: string, keys: Vapid, subject: string, now = Date.now()) {
  const part = (o: object) => b64(utf8(JSON.stringify(o)));
  // Push services refuse an expiry more than 24 hours away.
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })}`;
  const key = await importP256(unb64(keys.publicKey), unb64(keys.privateKey), 'ECDSA', ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(unsigned)));
  return `vapid t=${unsigned}.${b64(sig)}, k=${keys.publicKey}`;
}

/** Sends one push. `topic` lets a newer reminder of a kind replace an undelivered older one; `ttl` drops it once stale. */
export async function send(sub: Subscription, payload: string, options: { vapid: Vapid; subject: string; topic: string; ttl: number }) {
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapid(sub.endpoint, options.vapid, options.subject),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(options.ttl),
      Topic: options.topic,
      Urgency: 'normal',
    },
    body: await encrypt(utf8(payload), sub.keys),
  });
}
