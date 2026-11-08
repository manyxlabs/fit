# Fit

Fit ([fit.manyxlabs.com](https://fit.manyxlabs.com)) is a free, open-source fitness app for India: calories and macros, Indian veg and non-veg food, training, recovery, supplements and progress.
It plans each day and adjusts as you go, with no account and no ads.

## Privacy model

Everything you log is stored in IndexedDB in your own browser.
The server can never read anyone's health data.

- Sync between your devices is opt-in and end-to-end encrypted.
  Turning it on creates a 32-byte secret that lives only on your devices and in the sync link's fragment (`/app/#join=...`) or its QR code, so it never reaches the server.
  From the secret each device derives a room id, an access token, an AES-GCM key and an HMAC key for record ids.
  The server (a Cloudflare Durable Object per room) sees only the room id and stores, per record, an opaque id, a client timestamp, a random device tag and the ciphertext, plus a SHA-256 of the access token.
  Turn off sync deletes the room; a room nobody has synced for 400 days is deleted automatically.
- Reminders are opt-in and use standard Web Push.
  The server stores only the push subscription, the time zone and the reminder times, and sends generic messages such as "Time to log lunch", encrypted for the browser (RFC 8291) and signed with VAPID (RFC 8292).

The user-facing version is [the privacy page](src/pages/privacy.astro).

## Layout

- `src/pages/[...lang]/`: the static site (home, calculators, guides, exercises, privacy) in every language, built with Astro; `src/i18n/` holds the copy.
- `src/app/`: the app at `/app/`, one React island; `sync.ts` is the sync engine and `Pairing.tsx` and `Reminders.tsx` its settings in More.
- `worker/`: the Cloudflare Worker that serves the site and `/api/sync/<room>` (`sync.ts`) and `/api/push` (`push.ts`, `webpush.ts`).
- `public/sw.js`: the service worker, which also shows reminders and opens the right tab on click.

## Languages

Fit is published in English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada and Malayalam.
English keeps the unprefixed URLs; every other language mirrors the public pages under `/hi/`, `/bn/` and so on, with `hreflang` alternates and its pages in the sitemap.
The app at `/app/` switches language in the browser and remembers it.
All copy lives in typed catalogues under `src/i18n/<language>/`, guides under `src/guides/<language>/`, and food names people type in each script under `data/aliases/`.
A missing key, placeholder or tag in any language fails the build.

Health advice (the guides, exercise how-tos, readiness, fasting and target warnings, supplement advice and the calculators' explanations) goes live in a language only after a native speaker has checked it.
Until then that language shows those parts in English and publishes no guide or exercise pages of its own.
Each language's review list is kept with the project's working notes, outside git, in `.handoff/fit-i18n-review-<language>.md`.
Once a language is checked, set it to `true` in `src/i18n/review.ts`; nothing else needs to change.

## Local development

```sh
npm ci
npm run dev        # the site and app, without the Worker, at http://localhost:4321
npm run vapid      # once: writes DEV=1 and a development VAPID key pair to .dev.vars (git ignores it)
npm run worker     # builds, then runs the Worker with wrangler dev at http://localhost:8793
```

`DEV=1` allows a `http://localhost` push endpoint and a read of a room's stored rows, which the tests use.
It must never be set in production.

## Tests

```sh
npm run check        # astro check, and tsc for the Worker
npm run test:e2e     # the static suite against astro preview
npm run test:server  # sync, reminders and Web Push against wrangler dev, with a fresh VAPID pair per run
```

The server suite pairs two browsers, edits, deletes and goes offline, checks that the server holds no plaintext, and decrypts a real reminder sent to a local mock push service.
Screenshots and JSON evidence go to `test-results/artifacts/`.

After a deploy, check the live site end to end: its pages in each language, theme and size with no console errors, sync through the production Worker, and a reminder delivered by a real push service to a headed browser.
It cleans up the sync room and the push subscription it makes.

```sh
DISPLAY=:99 npx playwright test -c playwright.live.config.ts   # screenshots in test-results/artifacts/live/
```

## Deployment

Deploy only after the change has been reviewed and approved:

```sh
npm run build && npx wrangler deploy
```

### Secrets

Reminders need a VAPID key pair in production.
Print one with `node scripts/vapid.mjs --print`, then set each value:

```sh
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
```

Changing the pair invalidates every existing subscription, so keep it.

## Data sources

Nutrient data comes from the U.S. Department of Agriculture, Agricultural Research Service, FoodData Central, SR Legacy (final release, April 2018), [fdc.nal.usda.gov](https://fdc.nal.usda.gov), CC0 1.0.
Recipes are our own estimates of typical home-cooking amounts.
IFCT 2017 and INDB are never used.
See [data/SOURCES.md](data/SOURCES.md).

## License

MIT, see [LICENSE](LICENSE).
