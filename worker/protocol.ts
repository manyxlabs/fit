// The sync wire format, shared by the Room and the app. The server sees, per record, an opaque id,
// a version and ciphertext; it can order versions but never read what they hold.

/** A record's id is an HMAC of its store and key (or random, for auto-numbered stores), 128 bits in base64url. */
export const ID = /^[\w-]{22}$/;
/** A room id is 128 bits derived from the pairing secret; the access token 256. */
export const ROOM = /^[\w-]{22}$/;
export const AUTH = /^[\w-]{43}$/;
/** A random tag per device, which breaks ties between versions written in the same millisecond. */
export const DEV = /^[\w-]{11}$/;

export const MAX_BLOB = 64 << 10;
export const MAX_REQUEST = 1 << 20;
export const MAX_ROOM = 25 << 20;
/** How much a response carries before it asks the device to come back for more. */
export const PAGE = 512 << 10;

/** One record's version: `data` is base64url ciphertext, also for a deletion, so the server cannot forge one. */
export type Row = { id: string; at: number; dev: string; data: string };
export type Push = { since: number; put: Row[] };
export type Pulled = { seq: number; more: boolean; rows: Row[] };

/** Last writer wins: the later client timestamp, then the device tag. */
export const newer = (a: { at: number; dev: string }, b: { at: number; dev: string }) => a.at > b.at || (a.at === b.at && a.dev > b.dev);
