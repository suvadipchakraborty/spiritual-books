/**
 * Book metadata: chapter/verse structure for the three texts, plus a tiny
 * loader that pulls the full verse text from the bundled JSON files in
 * /data on first use and keeps it in memory after that.
 *
 * Every verse of all three texts ships inside this app (see /data/*.json)
 * — nothing is fetched from the internet. That means the library works
 * fully offline after the very first page load, and never depends on the
 * uptime of a third-party API.
 *
 * Translations were chosen to be plain, modern English rather than
 * archaic or heavily footnoted renderings, so a first-time reader with no
 * background in any of the three traditions can follow along:
 *   - Gita   -> A.C. Bhaktivedanta Swami Prabhupada's English rendering
 *               (falling back to Swami Adidevananda's for a small number
 *               of verses that Prabhupada's edition merges with the next)
 *   - Quran  -> Dr. Mustafa Khattab, "The Clear Quran"
 *   - Bible  -> World English Bible (WEB), a modern public-domain revision
 */

const QURAN_SURAHS = [
  {n:1,name:'Al-Faatiha',english:'The Opening',verses:7},
  {n:2,name:'Al-Baqara',english:'The Cow',verses:286},
  {n:3,name:'Aal-i-Imraan',english:'The Family of Imraan',verses:200},
  {n:4,name:'An-Nisaa',english:'The Women',verses:176},
  {n:5,name:'Al-Maaida',english:'The Table',verses:120},
  {n:6,name:'Al-An\'aam',english:'The Cattle',verses:165},
  {n:7,name:'Al-A\'raaf',english:'The Heights',verses:206},
  {n:8,name:'Al-Anfaal',english:'The Spoils of War',verses:75},
  {n:9,name:'At-Tawba',english:'The Repentance',verses:129},
  {n:10,name:'Yunus',english:'Jonas',verses:109},
  {n:11,name:'Hud',english:'Hud',verses:123},
  {n:12,name:'Yusuf',english:'Joseph',verses:111},
  {n:13,name:'Ar-Ra\'d',english:'The Thunder',verses:43},
  {n:14,name:'Ibrahim',english:'Abraham',verses:52},
  {n:15,name:'Al-Hijr',english:'The Rock',verses:99},
  {n:16,name:'An-Nahl',english:'The Bee',verses:128},
  {n:17,name:'Al-Israa',english:'The Night Journey',verses:111},
  {n:18,name:'Al-Kahf',english:'The Cave',verses:110},
  {n:19,name:'Maryam',english:'Mary',verses:98},
  {n:20,name:'Taa-Haa',english:'Taa-Haa',verses:135},
  {n:21,name:'Al-Anbiyaa',english:'The Prophets',verses:112},
  {n:22,name:'Al-Hajj',english:'The Pilgrimage',verses:78},
  {n:23,name:'Al-Muminoon',english:'The Believers',verses:118},
  {n:24,name:'An-Noor',english:'The Light',verses:64},
  {n:25,name:'Al-Furqaan',english:'The Criterion',verses:77},
  {n:26,name:'Ash-Shu\'araa',english:'The Poets',verses:227},
  {n:27,name:'An-Naml',english:'The Ant',verses:93},
  {n:28,name:'Al-Qasas',english:'The Stories',verses:88},
  {n:29,name:'Al-Ankaboot',english:'The Spider',verses:69},
  {n:30,name:'Ar-Room',english:'The Romans',verses:60},
  {n:31,name:'Luqman',english:'Luqman',verses:34},
  {n:32,name:'As-Sajda',english:'The Prostration',verses:30},
  {n:33,name:'Al-Ahzaab',english:'The Clans',verses:73},
  {n:34,name:'Saba',english:'Sheba',verses:54},
  {n:35,name:'Faatir',english:'The Originator',verses:45},
  {n:36,name:'Yaseen',english:'Yaseen',verses:83},
  {n:37,name:'As-Saaffaat',english:'Those drawn up in Ranks',verses:182},
  {n:38,name:'Saad',english:'The letter Saad',verses:88},
  {n:39,name:'Az-Zumar',english:'The Groups',verses:75},
  {n:40,name:'Ghafir',english:'The Forgiver',verses:85},
  {n:41,name:'Fussilat',english:'Explained in detail',verses:54},
  {n:42,name:'Ash-Shura',english:'Consultation',verses:53},
  {n:43,name:'Az-Zukhruf',english:'Ornaments of gold',verses:89},
  {n:44,name:'Ad-Dukhaan',english:'The Smoke',verses:59},
  {n:45,name:'Al-Jaathiya',english:'Crouching',verses:37},
  {n:46,name:'Al-Ahqaf',english:'The Dunes',verses:35},
  {n:47,name:'Muhammad',english:'Muhammad',verses:38},
  {n:48,name:'Al-Fath',english:'The Victory',verses:29},
  {n:49,name:'Al-Hujuraat',english:'The Inner Apartments',verses:18},
  {n:50,name:'Qaaf',english:'The letter Qaaf',verses:45},
  {n:51,name:'Adh-Dhaariyat',english:'The Winnowing Winds',verses:60},
  {n:52,name:'At-Tur',english:'The Mount',verses:49},
  {n:53,name:'An-Najm',english:'The Star',verses:62},
  {n:54,name:'Al-Qamar',english:'The Moon',verses:55},
  {n:55,name:'Ar-Rahmaan',english:'The Beneficent',verses:78},
  {n:56,name:'Al-Waaqia',english:'The Inevitable',verses:96},
  {n:57,name:'Al-Hadid',english:'The Iron',verses:29},
  {n:58,name:'Al-Mujaadila',english:'The Pleading Woman',verses:22},
  {n:59,name:'Al-Hashr',english:'The Exile',verses:24},
  {n:60,name:'Al-Mumtahana',english:'She that is to be examined',verses:13},
  {n:61,name:'As-Saff',english:'The Ranks',verses:14},
  {n:62,name:'Al-Jumu\'a',english:'Friday',verses:11},
  {n:63,name:'Al-Munaafiqoon',english:'The Hypocrites',verses:11},
  {n:64,name:'At-Taghaabun',english:'Mutual Disillusion',verses:18},
  {n:65,name:'At-Talaaq',english:'Divorce',verses:12},
  {n:66,name:'At-Tahrim',english:'The Prohibition',verses:12},
  {n:67,name:'Al-Mulk',english:'The Sovereignty',verses:30},
  {n:68,name:'Al-Qalam',english:'The Pen',verses:52},
  {n:69,name:'Al-Haaqqa',english:'The Reality',verses:52},
  {n:70,name:'Al-Ma\'aarij',english:'The Ascending Stairways',verses:44},
  {n:71,name:'Nooh',english:'Noah',verses:28},
  {n:72,name:'Al-Jinn',english:'The Jinn',verses:28},
  {n:73,name:'Al-Muzzammil',english:'The Enshrouded One',verses:20},
  {n:74,name:'Al-Muddaththir',english:'The Cloaked One',verses:56},
  {n:75,name:'Al-Qiyaama',english:'The Resurrection',verses:40},
  {n:76,name:'Al-Insaan',english:'Man',verses:31},
  {n:77,name:'Al-Mursalaat',english:'The Emissaries',verses:50},
  {n:78,name:'An-Naba',english:'The Announcement',verses:40},
  {n:79,name:'An-Naazi\'aat',english:'Those who drag forth',verses:46},
  {n:80,name:'Abasa',english:'He frowned',verses:42},
  {n:81,name:'At-Takwir',english:'The Overthrowing',verses:29},
  {n:82,name:'Al-Infitaar',english:'The Cleaving',verses:19},
  {n:83,name:'Al-Mutaffifin',english:'Defrauding',verses:36},
  {n:84,name:'Al-Inshiqaaq',english:'The Splitting Open',verses:25},
  {n:85,name:'Al-Burooj',english:'The Constellations',verses:22},
  {n:86,name:'At-Taariq',english:'The Morning Star',verses:17},
  {n:87,name:'Al-A\'laa',english:'The Most High',verses:19},
  {n:88,name:'Al-Ghaashiya',english:'The Overwhelming',verses:26},
  {n:89,name:'Al-Fajr',english:'The Dawn',verses:30},
  {n:90,name:'Al-Balad',english:'The City',verses:20},
  {n:91,name:'Ash-Shams',english:'The Sun',verses:15},
  {n:92,name:'Al-Lail',english:'The Night',verses:21},
  {n:93,name:'Ad-Dhuhaa',english:'The Morning Hours',verses:11},
  {n:94,name:'Ash-Sharh',english:'The Consolation',verses:8},
  {n:95,name:'At-Tin',english:'The Fig',verses:8},
  {n:96,name:'Al-Alaq',english:'The Clot',verses:19},
  {n:97,name:'Al-Qadr',english:'The Power, Fate',verses:5},
  {n:98,name:'Al-Bayyina',english:'The Evidence',verses:8},
  {n:99,name:'Az-Zalzala',english:'The Earthquake',verses:8},
  {n:100,name:'Al-Aadiyaat',english:'The Chargers',verses:11},
  {n:101,name:'Al-Qaari\'a',english:'The Calamity',verses:11},
  {n:102,name:'At-Takaathur',english:'Competition',verses:8},
  {n:103,name:'Al-Asr',english:'The Declining Day, Epoch',verses:3},
  {n:104,name:'Al-Humaza',english:'The Traducer',verses:9},
  {n:105,name:'Al-Fil',english:'The Elephant',verses:5},
  {n:106,name:'Quraish',english:'Quraysh',verses:4},
  {n:107,name:'Al-Maa\'un',english:'Almsgiving',verses:7},
  {n:108,name:'Al-Kawthar',english:'Abundance',verses:3},
  {n:109,name:'Al-Kaafiroon',english:'The Disbelievers',verses:6},
  {n:110,name:'An-Nasr',english:'Divine Support',verses:3},
  {n:111,name:'Al-Masad',english:'The Palm Fibre',verses:5},
  {n:112,name:'Al-Ikhlaas',english:'Sincerity',verses:4},
  {n:113,name:'Al-Falaq',english:'The Dawn',verses:5},
  {n:114,name:'An-Naas',english:'Mankind',verses:6}
];

const BIBLE_BOOKS = [
  {key:'genesis',name:'Genesis',chapters:50},
  {key:'exodus',name:'Exodus',chapters:40},
  {key:'leviticus',name:'Leviticus',chapters:27},
  {key:'numbers',name:'Numbers',chapters:36},
  {key:'deuteronomy',name:'Deuteronomy',chapters:34},
  {key:'joshua',name:'Joshua',chapters:24},
  {key:'judges',name:'Judges',chapters:21},
  {key:'ruth',name:'Ruth',chapters:4},
  {key:'1samuel',name:'1 Samuel',chapters:31},
  {key:'2samuel',name:'2 Samuel',chapters:24},
  {key:'1kings',name:'1 Kings',chapters:22},
  {key:'2kings',name:'2 Kings',chapters:25},
  {key:'1chronicles',name:'1 Chronicles',chapters:29},
  {key:'2chronicles',name:'2 Chronicles',chapters:36},
  {key:'ezra',name:'Ezra',chapters:10},
  {key:'nehemiah',name:'Nehemiah',chapters:13},
  {key:'esther',name:'Esther',chapters:10},
  {key:'job',name:'Job',chapters:42},
  {key:'psalms',name:'Psalms',chapters:150},
  {key:'proverbs',name:'Proverbs',chapters:31},
  {key:'ecclesiastes',name:'Ecclesiastes',chapters:12},
  {key:'songofsolomon',name:'Song of Solomon',chapters:8},
  {key:'isaiah',name:'Isaiah',chapters:66},
  {key:'jeremiah',name:'Jeremiah',chapters:52},
  {key:'lamentations',name:'Lamentations',chapters:5},
  {key:'ezekiel',name:'Ezekiel',chapters:48},
  {key:'daniel',name:'Daniel',chapters:12},
  {key:'hosea',name:'Hosea',chapters:14},
  {key:'joel',name:'Joel',chapters:3},
  {key:'amos',name:'Amos',chapters:9},
  {key:'obadiah',name:'Obadiah',chapters:1},
  {key:'jonah',name:'Jonah',chapters:4},
  {key:'micah',name:'Micah',chapters:7},
  {key:'nahum',name:'Nahum',chapters:3},
  {key:'habakkuk',name:'Habakkuk',chapters:3},
  {key:'zephaniah',name:'Zephaniah',chapters:3},
  {key:'haggai',name:'Haggai',chapters:2},
  {key:'zechariah',name:'Zechariah',chapters:14},
  {key:'malachi',name:'Malachi',chapters:4},
  {key:'matthew',name:'Matthew',chapters:28},
  {key:'mark',name:'Mark',chapters:16},
  {key:'luke',name:'Luke',chapters:24},
  {key:'john',name:'John',chapters:21},
  {key:'acts',name:'Acts',chapters:28},
  {key:'romans',name:'Romans',chapters:16},
  {key:'1corinthians',name:'1 Corinthians',chapters:16},
  {key:'2corinthians',name:'2 Corinthians',chapters:13},
  {key:'galatians',name:'Galatians',chapters:6},
  {key:'ephesians',name:'Ephesians',chapters:6},
  {key:'philippians',name:'Philippians',chapters:4},
  {key:'colossians',name:'Colossians',chapters:4},
  {key:'1thessalonians',name:'1 Thessalonians',chapters:5},
  {key:'2thessalonians',name:'2 Thessalonians',chapters:3},
  {key:'1timothy',name:'1 Timothy',chapters:6},
  {key:'2timothy',name:'2 Timothy',chapters:4},
  {key:'titus',name:'Titus',chapters:3},
  {key:'philemon',name:'Philemon',chapters:1},
  {key:'hebrews',name:'Hebrews',chapters:13},
  {key:'james',name:'James',chapters:5},
  {key:'1peter',name:'1 Peter',chapters:5},
  {key:'2peter',name:'2 Peter',chapters:3},
  {key:'1john',name:'1 John',chapters:5},
  {key:'2john',name:'2 John',chapters:1},
  {key:'3john',name:'3 John',chapters:1},
  {key:'jude',name:'Jude',chapters:1},
  {key:'revelation',name:'Revelation',chapters:22}
];

const LIBRARY = {
  gita: {
    id: "gita",
    name: "Bhagavad Gita",
    subtitle: "701 verses · all 18 chapters · offline",
    tagline: "The song of the Self, spoken on a battlefield.",
    color: "#6b5a3e",
    dataUrl: "/data/gita.json",
    // Exact verse counts per chapter, matching the bundled dataset
    // (chapter-closing colophon lines are not counted as verses).
    chapters: [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78],
    chapterTitles: [
      "Arjuna's Grief", "Sankhya Yoga", "Karma Yoga", "Jnana Yoga",
      "Karma Sannyasa Yoga", "Dhyana Yoga", "Jnana Vijnana Yoga",
      "Akshara Brahma Yoga", "Raja Vidya Yoga", "Vibhuti Yoga",
      "Vishvarupa Darshana Yoga", "Bhakti Yoga", "Kshetra Kshetrajna Yoga",
      "Gunatraya Vibhaga Yoga", "Purushottama Yoga", "Daivasura Sampad Yoga",
      "Shraddhatraya Vibhaga Yoga", "Moksha Sannyasa Yoga",
    ],
  },

  quran: {
    id: "quran",
    name: "The Quran",
    subtitle: "114 surahs · complete · offline",
    tagline: "A recitation, revealed in clear Arabic.",
    color: "#2f5d50",
    dataUrl: "/data/quran.json",
    surahs: QURAN_SURAHS,
  },

  bible: {
    id: "bible",
    name: "The Bible",
    subtitle: "66 books · Old & New Testament · offline",
    tagline: "Sacred scripture, translated for the world.",
    color: "#5a3e6b",
    dataUrl: "/data/bible.json",
    books: BIBLE_BOOKS,
  },
};

/* ---------------------------------------------------------------
   Local data loader — fetches each text's bundled JSON file the
   first time it is needed, then keeps it in memory. The service
   worker (sw.js) also caches these files on disk after first load,
   so every subsequent visit — online or off — is instant.
--------------------------------------------------------------- */
const _dataCache = {};

async function loadBookData(bookId) {
  if (_dataCache[bookId]) return _dataCache[bookId];
  const res = await fetch(LIBRARY[bookId].dataUrl);
  if (!res.ok) throw new Error(`Could not load ${bookId} data`);
  const json = await res.json();
  _dataCache[bookId] = json;
  return json;
}

async function getGitaVerse(chapter, verse) {
  const data = await loadBookData("gita");
  const entry = data[`${chapter}.${verse}`];
  return {
    reference: `Chapter ${chapter}, Verse ${verse}`,
    text: entry?.t || "This verse is being prepared.",
    original: entry?.r || "",
  };
}

async function getQuranVerse(surahNumber, ayah) {
  const data = await loadBookData("quran");
  const surah = data.chapters.find(c => c.n === surahNumber);
  const text = data.verses[`${surahNumber}.${ayah}`];
  return {
    reference: `${surah ? surah.english : "Surah " + surahNumber}, Ayah ${ayah}`,
    text: text || "This verse is being prepared.",
  };
}

async function getBibleVerse(bookKey, chapter, verseNumber) {
  const data = await loadBookData("bible");
  const bookVerses = data.verses[bookKey] || {};
  const text = bookVerses[`${chapter}.${verseNumber}`];
  const bookMeta = BIBLE_BOOKS.find(b => b.key === bookKey);
  return {
    reference: `${bookMeta ? bookMeta.name : bookKey} ${chapter}:${verseNumber}`,
    text: text || "This verse is being prepared.",
  };
}

async function getBibleChapterVerseCount(bookKey, chapter) {
  const data = await loadBookData("bible");
  return _countChapterVerses(data, bookKey, chapter);
}

// Synchronous variant for chrome updates (progress bar, prev/next state)
// that must not block on a fetch — returns null if the Bible data hasn't
// been loaded into memory yet (harmless; callers treat null as "unknown").
function peekBibleChapterVerseCount(bookKey, chapter) {
  const data = _dataCache.bible;
  if (!data) return null;
  return _countChapterVerses(data, bookKey, chapter);
}

function _countChapterVerses(data, bookKey, chapter) {
  const bookVerses = data.verses[bookKey] || {};
  let max = 0;
  const prefix = `${chapter}.`;
  Object.keys(bookVerses).forEach(k => {
    if (k.startsWith(prefix)) {
      const n = parseInt(k.slice(prefix.length), 10);
      if (n > max) max = n;
    }
  });
  return max;
}

// A handful of well-loved verses for the "Today's reflection" card on the
// home screen. Pulled from the bundled data at render time (see app.js).
const VERSE_OF_DAY_POOL = [
  { book: "gita", chapter: 2, verse: 47 },
  { book: "gita", chapter: 2, verse: 20 },
  { book: "quran", surah: 1, ayah: 1 },
  { book: "quran", surah: 112, ayah: 1 },
  { book: "bible", bookKey: "psalms", chapter: 23, verse: 1 },
  { book: "bible", bookKey: "john", chapter: 3, verse: 16 },
];
