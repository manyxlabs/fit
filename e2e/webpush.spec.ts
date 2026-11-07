import { expect, test } from '@playwright/test';
import { b64, unb64 } from '../worker/b64';
import { encrypt, encryptWith, importP256, MAX_PAYLOAD, vapid } from '../worker/webpush';
import { decryptPush, subscriptionKeys, verifyVapid } from './push';

// The Worker's Web Push crypto on its own, as a mistake there fails silently: the push service
// accepts the message and the browser drops it. The ways it could go wrong, each caught below:
// - HKDF inputs swapped: the auth secret is the salt and the ECDH secret the key material, not the reverse
// - key_info with the wrong label, without its NUL, or with the two public keys in the wrong order
// - the CEK and nonce info strings without their NUL, or the wrong lengths (16 and 12 bytes)
// - no 0x02 last-record delimiter, or 0x01 (which means more records follow)
// - a header with rs not big-endian 4096, idlen not 65, or the key id not the sender's raw public key
// - keys in the wrong form: compressed or SPKI instead of raw uncompressed points
// - reusing the salt or sender key between messages
// - a payload too large for one record cut short instead of refused
// - VAPID: a DER signature where JWS wants raw r||s, padded base64, an audience with a path, an
//   expiry more than 24 hours out, or k not the signing key's public point

// RFC 8291, section 5.
const RFC = {
  plaintext: 'When I grow up, I want to be a watermelon',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};
const text = new TextEncoder();
const buf = (s: string) => Buffer.from(s, 'base64url');

test('encryption matches the RFC 8291 test vector byte for byte', async () => {
  const privateKey = await importP256(unb64(RFC.asPublic), unb64(RFC.asPrivate), 'ECDH', ['deriveBits']);
  const out = await encryptWith(text.encode(RFC.plaintext), { p256dh: unb64(RFC.uaPublic), auth: unb64(RFC.auth) }, unb64(RFC.salt), { publicRaw: unb64(RFC.asPublic), privateKey });
  expect(b64(out)).toBe(RFC.body);
});

test('the test decrypter reads the RFC vector, so it can judge the Worker', () => {
  const { rs, plaintext } = decryptPush(buf(RFC.body), { privateKey: buf(RFC.uaPrivate), publicKey: buf(RFC.uaPublic), auth: buf(RFC.auth) });
  expect(rs).toBe(4096);
  expect(plaintext.toString()).toBe(RFC.plaintext);
});

test('each message gets a fresh salt and sender key, and decrypts', async () => {
  const keys = subscriptionKeys();
  const sub = { p256dh: b64(keys.publicKey), auth: b64(keys.auth) };
  const [a, b] = await Promise.all([encrypt(text.encode('Time to log lunch'), sub), encrypt(text.encode('Time to log lunch'), sub)]);
  const [da, db] = [decryptPush(Buffer.from(a), keys), decryptPush(Buffer.from(b), keys)];
  expect(da.plaintext.toString()).toBe('Time to log lunch');
  expect(db.plaintext.toString()).toBe('Time to log lunch');
  expect(Buffer.from(a.subarray(0, 16)).equals(Buffer.from(b.subarray(0, 16)))).toBe(false);
  expect(da.sender.equals(db.sender)).toBe(false);
  await expect(encrypt(new Uint8Array(MAX_PAYLOAD + 1), sub)).rejects.toThrow('too large');
});

test('the VAPID header verifies as a push service checks it', async () => {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const keys = { publicKey: b64(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))), privateKey: jwk.d! };
  const header = await vapid('https://fcm.googleapis.com/fcm/send/abc:def', keys, 'mailto:someone@example.com');
  const { claims, publicKey } = verifyVapid(header, 'https://fcm.googleapis.com');
  expect(publicKey).toBe(keys.publicKey);
  expect(claims.sub).toBe('mailto:someone@example.com');
});
