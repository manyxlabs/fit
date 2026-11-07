// Reads a zip's directory and streams one entry, without loading the archive into memory:
// an Apple Health export is often hundreds of MB.

export type Entry = { name: string; method: number; size: number; offset: number };

/** Why files could not be read, as a code: the worker cannot load the app's copy, so the page puts it into words. */
export class Unreadable extends Error {
  constructor(
    readonly code: 'notZip' | 'damaged' | 'password' | 'method' | 'noData',
    readonly file = '',
  ) {
    super(code);
  }
}

const MAX32 = 0xffffffff;
type Bytes = Uint8Array<ArrayBuffer>;
const span = (start: number, length: number) => [start, start + length] as const;

export async function entries(file: Blob): Promise<Entry[]> {
  const tailStart = Math.max(0, file.size - (22 + 0xffff + 20));
  const tail = new DataView(await file.slice(tailStart).arrayBuffer());
  let eocd = tail.byteLength - 22;
  while (eocd >= 0 && tail.getUint32(eocd, true) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Unreadable('notZip');
  let count = tail.getUint16(eocd + 10, true);
  let cdSize = tail.getUint32(eocd + 12, true);
  let cdOffset = tail.getUint32(eocd + 16, true);
  if (cdOffset === MAX32 || cdSize === MAX32 || count === 0xffff) {
    if (eocd < 20 || tail.getUint32(eocd - 20, true) !== 0x07064b50) throw new Unreadable('damaged');
    const z = new DataView(await file.slice(...span(Number(tail.getBigUint64(eocd - 12, true)), 56)).arrayBuffer());
    count = Number(z.getBigUint64(32, true));
    cdSize = Number(z.getBigUint64(40, true));
    cdOffset = Number(z.getBigUint64(48, true));
  }
  const cd = new DataView(await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
  const utf8 = new TextDecoder();
  const out: Entry[] = [];
  for (let p = 0, i = 0; i < count; i++) {
    if (cd.getUint32(p, true) !== 0x02014b50) throw new Unreadable('damaged');
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const e: Entry = {
      name: utf8.decode(new Uint8Array(cd.buffer, p + 46, nameLen)),
      method: cd.getUint16(p + 10, true),
      size: cd.getUint32(p + 20, true),
      offset: cd.getUint32(p + 42, true),
    };
    if (cd.getUint16(p + 8, true) & 1) throw new Unreadable('password');
    // Zip64 keeps the real values in an extra field, in this order, for those that overflowed.
    for (let x = p + 46 + nameLen; x < p + 46 + nameLen + extraLen; x += 4 + cd.getUint16(x + 2, true)) {
      if (cd.getUint16(x, true) !== 1) continue;
      let f = x + 4;
      if (cd.getUint32(p + 24, true) === MAX32) f += 8;
      if (e.size === MAX32) (e.size = Number(cd.getBigUint64(f, true))), (f += 8);
      if (e.offset === MAX32) e.offset = Number(cd.getBigUint64(f, true));
    }
    out.push(e);
    p += 46 + nameLen + extraLen + cd.getUint16(p + 32, true);
  }
  return out;
}

/** onRead hears the compressed bytes as they are read, for a progress bar. */
export async function open(file: Blob, e: Entry, onRead: (bytes: number) => void): Promise<ReadableStream<Bytes>> {
  const local = new DataView(await file.slice(...span(e.offset, 30)).arrayBuffer());
  if (local.getUint32(0, true) !== 0x04034b50) throw new Unreadable('damaged');
  const start = e.offset + 30 + local.getUint16(26, true) + local.getUint16(28, true);
  const raw = counted(file.slice(start, start + e.size).stream(), onRead);
  if (e.method === 0) return raw;
  if (e.method === 8) return raw.pipeThrough(new DecompressionStream('deflate-raw'));
  throw new Unreadable('method', e.name);
}

export const counted = (s: ReadableStream<Bytes>, onRead: (bytes: number) => void) =>
  s.pipeThrough(
    new TransformStream<Bytes, Bytes>({
      transform(chunk, c) {
        onRead(chunk.byteLength);
        c.enqueue(chunk);
      },
    }),
  );
