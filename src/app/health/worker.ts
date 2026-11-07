/// <reference lib="webworker" />
import { apple, Collector, googleFit, samsung } from './parse';
import { counted, entries, open, Unreadable } from './zip';

export type Request = File[];
export type Reply = { progress: number } | { result: ReturnType<Collector['result']> } | { error: Unreadable['code'] | 'unreadable'; file: string };

const post = (r: Reply) => postMessage(r);
const SAMSUNG = /com\.samsung\.[\w.]+\.\d+\.csv$/;
const GOOGLE_FIT = /Daily (activity metrics|Summaries)\.csv$/;

onmessage = async ({ data: files }: MessageEvent<Request>) => {
  try {
    const total = files.reduce((s, f) => s + f.size, 0);
    let read = 0;
    let last = 0;
    const onRead = (n: number) => {
      read += n;
      if (read - last > total / 100) post({ progress: read / total }), (last = read);
    };
    const c = new Collector();
    const csvs: { name: string; text: string }[] = [];
    let xml = 0;
    for (const f of files) {
      if (/\.xml$/i.test(f.name)) xml++, await apple(counted(f.stream(), onRead).pipeThrough(new TextDecoderStream()), c);
      else if (/\.csv$/i.test(f.name)) csvs.push({ name: f.name, text: await f.text() }), onRead(f.size);
      else if (/\.zip$/i.test(f.name)) {
        const list = await entries(f);
        // Health's export.xml, by size: the file is named for the phone's language.
        const health = list.filter((e) => /(^|\/)apple_health_export\/[^/]+\.xml$/.test(e.name) && !/_cda\.xml$/.test(e.name)).sort((a, b) => b.size - a.size)[0];
        if (health) xml++, await apple((await open(f, health, onRead)).pipeThrough(new TextDecoderStream()), c);
        for (const e of list.filter((x) => SAMSUNG.test(x.name) || GOOGLE_FIT.test(x.name))) csvs.push({ name: e.name, text: await new Response(await open(f, e, onRead)).text() });
      }
    }
    const fromSamsung = samsung(csvs, c);
    const fromFit = csvs.filter((x) => !SAMSUNG.test(x.name)).map((x) => googleFit(x.text, c));
    if (!xml && !fromSamsung && !fromFit.includes(true)) throw new Unreadable('noData');
    post({ result: c.result() });
  } catch (e) {
    console.error(e);
    post(e instanceof Unreadable ? { error: e.code, file: e.file } : { error: 'unreadable', file: '' });
  }
};
