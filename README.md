# Ekayana — Spiritual Library

A calm, mobile-first reader that brings the **complete Bhagavad Gita**, the
**complete Quran**, and the **complete Bible** into one distraction-free
interface — fully offline, in plain modern English, with your exact
reading position remembered automatically, on-device.

## Stack

- Vanilla HTML / CSS / JS — no build step, no framework
- Cloudflare Worker (`src/worker.js`) serving static assets via the
  Workers Assets binding (see `wrangler.toml`)
- Installable PWA: `manifest.webmanifest` + `sw.js` for offline caching
- **Every verse of all three texts ships inside the app** as bundled JSON
  in `public/data/` — nothing is fetched from a third-party API at read
  time, so the library works with zero network connection after the
  first load, and never depends on the uptime of an external service.

## Texts & translations

Chosen specifically for plain, modern readability rather than archaic or
heavily footnoted renderings, so someone with no background in any of
these traditions can simply sit down and read:

| Text | Coverage | Translation | Source |
|---|---|---|---|
| Bhagavad Gita | 18 chapters, 701 verses (complete) | Primarily A.C. Bhaktivedanta Swami Prabhupada, with a small number of verses from Swami Adidevananda where Prabhupada's edition merges them with the next verse | [vedicscriptures/bhagavad-gita](https://github.com/vedicscriptures/bhagavad-gita) |
| Quran | 114 surahs, 6,236 ayahs (complete) | Dr. Mustafa Khattab, *The Clear Quran* — translated specifically for plain modern readability | [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) |
| Bible | 66 books, Old & New Testament (complete) | World English Bible (WEB) — a free, modern-English, public-domain revision of the ASV | [tehshrike/world-english-bible](https://github.com/tehshrike/world-english-bible) |

All three are public-domain or freely-licensed for redistribution. The
build scripts used to turn each source into the compact JSON files in
`public/data/` are not included here (they were one-off data-prep
scripts), but the process is straightforward to reproduce from the
sources above if you want to swap in a different translation or add
more surahs/books later — see "Extending the library" below.

## Local development

```bash
npm install
npm run dev      # wrangler dev — serves public/ through src/worker.js
```

## Deploy to Cloudflare (GitHub sync)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Connect to Git**,
   pick this repo.
3. Build command: *(leave empty)* — Deploy command: `npx wrangler deploy`.
4. Cloudflare reads `wrangler.toml` automatically: it deploys
   `src/worker.js` as the Worker and serves everything in `public/` as
   static assets through the `ASSETS` binding.
5. Once live, update the absolute URLs in `public/index.html`
   (Open Graph tags) and `public/js/app.js` (share URL) if your final
   domain differs from
   `https://spiritual-books.suvadipchakraborty.workers.dev/`.

## Project structure

```
public/
  index.html               Single-page app shell (Home / Reader / About)
  css/styles.css            Theming (light/sepia/dark), typography, layout
  js/books.js                 Chapter/verse metadata + local data loaders
  js/app.js                    State, routing, reader logic, gestures, share
  data/
    gita.json                    Full Bhagavad Gita text (~230 KB)
    quran.json                   Full Quran text + surah metadata (~910 KB)
    bible.json                   Full Bible text + book metadata (~4.1 MB)
  manifest.webmanifest      PWA install metadata
  sw.js                     Offline caching service worker (precaches all
                             three text files on install)
  assets/                   Icons + Open Graph image (SVG, source-editable)
src/worker.js              Cloudflare Worker — serves public/ + adds headers
wrangler.toml               Worker + static assets configuration
```

## How the offline reading works

- `public/js/books.js` holds small, hand-verified structural metadata for
  all three texts (chapter/surah/book names and verse counts) so the
  Home screen and navigation work instantly, with no fetch required.
- The actual verse **text** for each book lives in its own JSON file
  under `public/data/` and is loaded lazily the first time that book is
  opened, then kept in memory for the rest of the session.
- `sw.js` precaches all three data files the moment the app is
  installed/first visited, and `app.js` also proactively warms them in
  the background shortly after first paint — so in practice, every text
  is available offline within a second or two of the very first visit,
  not just the one the person opens first.
- Reading progress (`localStorage`, key `ekayana_progress_v2`) is
  tracked as an exact `{book/chapter/verse}` position per text and
  restored automatically on return.

## Extending the library

Both `LIBRARY.quran.surahs` and `LIBRARY.bible.books` in `books.js`
already describe the complete canon (114 surahs / 66 books), so no
metadata changes are needed to read anything — the app already supports
the whole of both texts out of the box. To swap in a different
translation for any of the three texts, replace the corresponding file
in `public/data/` with one in the same shape (see the loader functions
at the bottom of `books.js` for the exact key format each file uses).

Built by Suva.
