// A push service's and a browser's side of Web Push, written with Node's crypto rather than
// WebCrypto, so the Worker's code is checked against a second implementation, not itself.
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto';

const url64 = (b: Buffer) => b.toString('base64url');

/** A browser's push subscription keys, with the private half a browser would keep. */
export function subscriptionKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { privateKey: ecdh.getPrivateKey(), publicKey: ecdh.getPublicKey(), auth: randomBytes(16) };
}
export type Keys = ReturnType<typeof subscriptionKeys>;

/** Decrypts an aes128gcm push body as a browser does; throws on anything malformed. */
export function decryptPush(body: Buffer, keys: { privateKey: Buffer; publicKey: Buffer; auth: Buffer }) {
  const salt = body.subarray(0, 16);
  const rs = body.readUInt32BE(16);
  const sender = body.subarray(21, 21 + body[20]!);
  const sealed = body.subarray(21 + body[20]!);
  if (sealed.length > rs) throw new Error('More than one record');
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(keys.privateKey);
  const secret = ecdh.computeSecret(sender);
  const ikm = Buffer.from(hkdfSync('sha256', secret, keys.auth, Buffer.concat([Buffer.from('WebPush: info\0'), keys.publicKey, sender]), 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: aes128gcm\0', 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: nonce\0', 12));
  const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(sealed.subarray(-16));
  const padded = Buffer.concat([decipher.update(sealed.subarray(0, -16)), decipher.final()]);
  let end = padded.length - 1;
  while (end >= 0 && padded[end] === 0) end--;
  if (padded[end] !== 2) throw new Error('No last-record delimiter');
  return { rs, sender, plaintext: padded.subarray(0, end) };
}

/** Checks a VAPID Authorization header as a push service does, and returns its claims. */
export function verifyVapid(header: string, audience: string, now = Date.now()) {
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(header);
  if (!m) throw new Error(`Malformed VAPID header: ${header}`);
  const [, head, body, sig, k] = m as unknown as [string, string, string, string, string];
  const point = Buffer.from(k, 'base64url');
  if (point.length !== 65 || point[0] !== 4) throw new Error('k is not an uncompressed P-256 point');
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: url64(point.subarray(1, 33)), y: url64(point.subarray(33)) }, format: 'jwk' });
  if (!verify('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'))) throw new Error('Bad VAPID signature');
  const jose = JSON.parse(Buffer.from(head, 'base64url').toString());
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString()) as { aud: string; exp: number; sub: string };
  if (jose.alg !== 'ES256' || jose.typ !== 'JWT') throw new Error('Wrong JWT header');
  if (claims.aud !== audience) throw new Error(`Wrong audience ${claims.aud}`);
  if (claims.exp * 1000 <= now || claims.exp * 1000 > now + 24 * 3600_000) throw new Error('Expiry outside the next 24 hours');
  if (!/^(mailto:|https:)/.test(claims.sub)) throw new Error('Subject is not a contact');
  return { claims, publicKey: k };
}
