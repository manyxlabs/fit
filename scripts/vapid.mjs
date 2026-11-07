// Makes a VAPID key pair for reminders. With no argument it writes one into .dev.vars for
// `wrangler dev`, which git ignores; with --print it only prints a pair, for production secrets.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString('base64url');
const privateKey = (await crypto.subtle.exportKey('jwk', pair.privateKey)).d;
const vars = `VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`;

if (process.argv.includes('--print')) process.stdout.write(vars);
else if (existsSync('.dev.vars') && readFileSync('.dev.vars', 'utf8').includes('VAPID_PRIVATE_KEY')) console.log('.dev.vars already has a VAPID key pair.');
else {
  writeFileSync('.dev.vars', (existsSync('.dev.vars') ? readFileSync('.dev.vars', 'utf8') : '') + `DEV=1\n${vars}`);
  console.log('Wrote a development VAPID key pair to .dev.vars.');
}
