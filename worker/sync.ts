import { DurableObject } from 'cloudflare:workers';
import { b64, unb64 } from './b64';
import type { Env } from './index';
import { AUTH, DEV, ID, MAX_BLOB, MAX_REQUEST, MAX_ROOM, newer, PAGE, ROOM, type Pulled, type Push, type Row } from './protocol';

// Records rather than a CRDT log (as Gloss uses): Fit's data is many small independent records
// (a meal, a day, a workout), each written whole, so last-writer-wins per record merges as well
// as a CRDT would, and the server can keep just the latest version of each instead of a log.

/** A room nobody has synced with for this long is deleted, so data whose secret every device has lost is not kept forever. */
const IDLE = 400 * 86_400_000;
const MAX_DATA = Math.ceil((MAX_BLOB * 4) / 3);

type Stored = { id: string; at: number; dev: string; seq: number; data: ArrayBuffer };

/** One person's synced devices: the latest encrypted version of each record. Nothing here can be decrypted. */
export class Room extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS rec (id TEXT PRIMARY KEY, at INTEGER NOT NULL, dev TEXT NOT NULL, seq INTEGER NOT NULL, data BLOB NOT NULL)');
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS rec_seq ON rec (seq)');
  }

  /**
   * The first token presented claims the room; afterwards only the same token is let in. It is
   * derived from the pairing secret, which the server never sees and cannot work back to.
   */
  private async authorize(auth: string) {
    if (!AUTH.test(auth)) return false;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(auth));
    // No await between reading and claiming, so two first visitors cannot both claim the room.
    const stored = this.ctx.storage.kv.get<ArrayBuffer>('auth');
    if (!stored) this.ctx.storage.kv.put('auth', hash);
    return !stored || crypto.subtle.timingSafeEqual(stored, hash);
  }

  async fetch(request: Request) {
    const kv = this.ctx.storage.kv;
    // A deleted room stays deleted, so a device that missed the news cannot fill it again.
    if (kv.get('deleted')) return new Response('Sync was turned off', { status: 410 });
    if (!(await this.authorize(request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''))) return new Response('Forbidden', { status: 403 });
    if (request.method === 'DELETE') {
      await this.remove();
      return new Response(null, { status: 204 });
    }
    if (request.method === 'GET' && this.env.DEV === '1') return Response.json(this.ctx.storage.sql.exec<Stored>('SELECT * FROM rec ORDER BY seq').toArray().map(row));
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const body = parse(await request.text());
    if (!body) return new Response('Bad request', { status: 400 });
    await this.ctx.storage.setAlarm(Date.now() + IDLE);

    const sql = this.ctx.storage.sql;
    const written = new Set<string>();
    const rejected: string[] = [];
    try {
      this.ctx.storage.transactionSync(() => {
        let seq = kv.get<number>('seq') ?? 0;
        let bytes = kv.get<number>('bytes') ?? 0;
        for (const row of body.put) {
          const old = sql.exec<{ at: number; dev: string; size: number }>('SELECT at, dev, length(data) AS size FROM rec WHERE id = ?', row.id).toArray()[0];
          if (old && !newer(row, old)) {
            rejected.push(row.id);
            continue;
          }
          const data = unb64(row.data);
          bytes += data.byteLength - (old?.size ?? 0);
          sql.exec('INSERT OR REPLACE INTO rec (id, at, dev, seq, data) VALUES (?, ?, ?, ?, ?)', row.id, row.at, row.dev, ++seq, data);
          written.add(row.id);
        }
        // Thrown inside the transaction, so a request that would overfill the room changes nothing.
        if (bytes > MAX_ROOM) throw new Full();
        kv.put('seq', seq);
        kv.put('bytes', bytes);
      });
    } catch (e) {
      if (e instanceof Full) return new Response('Room full', { status: 413 });
      throw e;
    }

    // What changed since the device last asked, but not what it just sent; and the current version of
    // whatever it sent that was older, so it adopts that.
    const out: Pulled = { seq: body.since, more: false, rows: [] };
    let size = 0;
    for (const id of rejected) out.rows.push(row(sql.exec<Stored>('SELECT * FROM rec WHERE id = ?', id).one()));
    for (const r of sql.exec<Stored>('SELECT * FROM rec WHERE seq > ? ORDER BY seq', body.since)) {
      if (size > PAGE) {
        out.more = true;
        break;
      }
      out.seq = r.seq;
      if (written.has(r.id)) continue;
      size += r.data.byteLength;
      out.rows.push(row(r));
    }
    return Response.json(out);
  }

  async alarm() {
    await this.remove();
  }

  private async remove() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    this.ctx.storage.kv.put('deleted', true);
  }
}

class Full extends Error {}

const row = (r: Stored): Row => ({ id: r.id, at: r.at, dev: r.dev, data: b64(new Uint8Array(r.data)) });

function parse(text: string): Push | null {
  try {
    const body = JSON.parse(text) as Push;
    if (!Number.isSafeInteger(body.since) || body.since < 0 || !Array.isArray(body.put)) return null;
    const ids = new Set<string>();
    for (const r of body.put) {
      if (!ID.test(r?.id) || ids.has(r.id) || !Number.isSafeInteger(r.at) || r.at <= 0 || !DEV.test(r.dev)) return null;
      if (typeof r.data !== 'string' || !r.data || r.data.length > MAX_DATA || !/^[\w-]+$/.test(r.data)) return null;
      ids.add(r.id);
    }
    return body;
  } catch {
    return null;
  }
}

/** `POST /api/sync/<room>` sends changes and receives the others'; `DELETE` removes the room. */
export async function handleSync(request: Request, env: Env, room: string) {
  if (!ROOM.test(room)) return new Response('Not found', { status: 404 });
  if (request.method === 'POST') {
    // The runtime holds a body to its declared length, so checking the header bounds the read.
    const length = Number(request.headers.get('Content-Length'));
    if (!request.headers.has('Content-Length') || !Number.isSafeInteger(length)) return new Response('Length required', { status: 411 });
    if (length > MAX_REQUEST) return new Response('Too large', { status: 413 });
  }
  return env.ROOMS.getByName(room).fetch(request);
}
