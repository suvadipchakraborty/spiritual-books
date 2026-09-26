(() => {
  "use strict";

  /* ---------------------------------------------------------
     Persistent state
     (v2: bible now tracks an actual verse number, not an index
     into a fetched chapter array — see the offline data rewrite)
  --------------------------------------------------------- */
  const PROGRESS_KEY = "ekayana_progress_v2";
  const SETTINGS_KEY = "ekayana_settings_v1";

  const defaultProgress = {
    gita: { chapter: 1, verse: 1 },
    quran: { surahIndex: 0, ayah: 1 },
    bible: { bookIndex: 0, chapter: 1, verse: 1 },
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch {
      return { ...fallback };
    }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }

  let progress = loadJSON(PROGRESS_KEY, defaultProgress);
  let settings = loadJSON(SETTINGS_KEY, { theme: "light", fontSize: "md" });

  function saveProgress() { saveJSON(PROGRESS_KEY, progress); }
  function saveSettings() { saveJSON(SETTINGS_KEY, settings); }

  /* ---------------------------------------------------------
     Theme / text size
  --------------------------------------------------------- */
  function applySettings() {
    document.body.setAttribute("data-theme", settings.theme);
    document.body.setAttribute("data-size", settings.fontSize);
    document.querySelectorAll("#theme-picker button").forEach(b =>
      b.classList.toggle("active", b.dataset.theme === settings.theme));
    document.querySelectorAll("#size-picker button").forEach(b =>
      b.classList.toggle("active", b.dataset.size === settings.fontSize));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.body).backgroundColor;
  }

  document.getElementById("theme-picker").addEventListener("click", e => {
    const btn = e.target.closest("button[data-theme]");
    if (!btn) return;
    settings.theme = btn.dataset.theme;
    saveSettings();
    applySettings();
  });
  document.getElementById("size-picker").addEventListener("click", e => {
    const btn = e.target.closest("button[data-size]");
    if (!btn) return;
    settings.fontSize = btn.dataset.size;
    saveSettings();
    applySettings();
  });

  const sheetBackdrop = document.getElementById("sheet-backdrop");
  document.getElementById("btn-settings").addEventListener("click", () => { sheetBackdrop.hidden = false; });
  document.getElementById("btn-sheet-close").addEventListener("click", () => { sheetBackdrop.hidden = true; });
  sheetBackdrop.addEventListener("click", e => { if (e.target === sheetBackdrop) sheetBackdrop.hidden = true; });

  /* ---------------------------------------------------------
     Routing between the three <main> views + tab bar
  --------------------------------------------------------- */
  const views = {
    home: document.getElementById("view-home"),
    reader: document.getElementById("view-reader"),
    about: document.getElementById("view-about"),
  };
  const tabs = document.querySelectorAll(".tab");
  const backBtn = document.getElementById("btn-back");
  const footer = document.querySelector(".site-footer");

  let currentBook = null; // 'gita' | 'quran' | 'bible' | null

  function showView(name) {
    Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
    backBtn.hidden = name !== "reader";
    footer.style.display = name === "reader" ? "none" : "flex";
    tabs.forEach(t => {
      const tab = t.dataset.tab;
      const isActive = (name === "reader" && tab === currentBook) ||
                        (name !== "reader" && tab === name);
      if (isActive) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.tab;
      if (key === "home" || key === "about") {
        currentBook = null;
        showView(key);
        if (key === "home") renderHome();
      } else {
        openReader(key);
      }
    });
  });
  backBtn.addEventListener("click", () => { currentBook = null; showView("home"); renderHome(); });

  /* ---------------------------------------------------------
     Home: library cards + verse of the day
  --------------------------------------------------------- */
  function progressFraction(bookId) {
    if (bookId === "gita") {
      const total = LIBRARY.gita.chapters.reduce((a, b) => a + b, 0);
      const done = LIBRARY.gita.chapters.slice(0, progress.gita.chapter - 1).reduce((a, b) => a + b, 0) + progress.gita.verse;
      return Math.min(1, done / total);
    }
    if (bookId === "quran") {
      const s = LIBRARY.quran.surahs;
      const total = s.reduce((a, b) => a + b.verses, 0);
      const done = s.slice(0, progress.quran.surahIndex).reduce((a, b) => a + b.verses, 0) + progress.quran.ayah;
      return Math.min(1, done / total);
    }
    const b = LIBRARY.bible.books;
    const total = b.reduce((a, x) => a + x.chapters, 0);
    const done = b.slice(0, progress.bible.bookIndex).reduce((a, x) => a + x.chapters, 0) + progress.bible.chapter;
    return Math.min(1, done / total);
  }

  function locationLabel(bookId) {
    if (bookId === "gita") return `Chapter ${progress.gita.chapter}, Verse ${progress.gita.verse}`;
    if (bookId === "quran") {
      const s = LIBRARY.quran.surahs[progress.quran.surahIndex];
      return `${s.english}, Ayah ${progress.quran.ayah}`;
    }
    const b = LIBRARY.bible.books[progress.bible.bookIndex];
    return `${b.name} ${progress.bible.chapter}:${progress.bible.verse}`;
  }

  function hasStarted(bookId) {
    if (bookId === "gita") return !(progress.gita.chapter === 1 && progress.gita.verse === 1);
    if (bookId === "quran") return !(progress.quran.surahIndex === 0 && progress.quran.ayah === 1);
    return !(progress.bible.bookIndex === 0 && progress.bible.chapter === 1 && progress.bible.verse === 1);
  }

  function renderHome() {
    const grid = document.getElementById("library-grid");
    grid.innerHTML = "";
    ["gita", "quran", "bible"].forEach(id => {
      const meta = LIBRARY[id];
      const started = hasStarted(id);
      const pct = Math.round(progressFraction(id) * 100);
      const card = document.createElement("button");
      card.className = "book-card";
      card.innerHTML = `
        <div class="book-glyph" style="background:${meta.color}">${meta.name[0]}</div>
        <div class="book-card-body">
          <p class="book-card-title">${meta.name}</p>
          <p class="book-card-sub">${started ? locationLabel(id) : meta.tagline}</p>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${meta.color}"></div></div>
          <p class="book-card-cta" style="color:${meta.color}">${started ? "Continue reading →" : "Begin reading →"}</p>
        </div>`;
      card.addEventListener("click", () => openReader(id));
      grid.appendChild(card);
    });

    const hour = new Date().getHours();
    document.getElementById("greeting-time").textContent =
      hour < 5 ? "night owl" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

    renderVerseOfDay();
  }

  async function renderVerseOfDay() {
    const el = document.getElementById("votd");
    const dayIndex = Math.floor(Date.now() / 86400000) % VERSE_OF_DAY_POOL.length;
    const pick = VERSE_OF_DAY_POOL[dayIndex];
    el.innerHTML = `<p class="votd-label">Today's reflection · ${LIBRARY[pick.book].name}</p><p class="votd-text">Loading…</p>`;
    try {
      let data;
      if (pick.book === "gita") data = await getGitaVerse(pick.chapter, pick.verse);
      else if (pick.book === "quran") data = await getQuranVerse(pick.surah, pick.ayah);
      else data = await getBibleVerse(pick.bookKey, pick.chapter, pick.verse);
      el.innerHTML = `
        <p class="votd-label">Today's reflection · ${LIBRARY[pick.book].name}</p>
        <p class="votd-text">"${data.text}"</p>
        <p class="votd-ref">${data.reference}</p>`;
    } catch {
      el.innerHTML = "";
    }
  }

  /* ---------------------------------------------------------
     Reader
  --------------------------------------------------------- */
  const els = {
    stage: document.getElementById("verse-stage"),
    original: document.getElementById("verse-original"),
    text: document.getElementById("verse-text"),
    ref: document.getElementById("verse-ref"),
    fill: document.getElementById("reader-progress-fill"),
    jumpBtn: document.getElementById("btn-jump"),
    prev: document.getElementById("btn-prev"),
    next: document.getElementById("btn-next"),
  };

  function openReader(bookId) {
    currentBook = bookId;
    showView("reader");
    loadCurrentPassage();
  }

  async function loadCurrentPassage() {
    els.text.textContent = "Loading…";
    els.original.hidden = true;
    els.ref.textContent = "";

    try {
      if (currentBook === "gita") {
        const { chapter, verse } = progress.gita;
        const data = await getGitaVerse(chapter, verse);
        renderVerse(data, true);
      } else if (currentBook === "quran") {
        const surah = LIBRARY.quran.surahs[progress.quran.surahIndex];
        const data = await getQuranVerse(surah.n, progress.quran.ayah);
        renderVerse(data, false);
      } else if (currentBook === "bible") {
        const book = LIBRARY.bible.books[progress.bible.bookIndex];
        const data = await getBibleVerse(book.key, progress.bible.chapter, progress.bible.verse);
        renderVerse(data, false);
      }
    } catch (err) {
      els.text.textContent = "This text is still downloading — please check your connection and try again.";
      els.ref.textContent = "";
    }
    updateReaderChrome();
  }

  function renderVerse(data, showOriginal) {
    els.text.style.opacity = 0;
    requestAnimationFrame(() => {
      els.text.textContent = data.text;
      els.ref.textContent = data.reference;
      if (showOriginal && data.original) {
        els.original.textContent = data.original;
        els.original.hidden = false;
      } else {
        els.original.hidden = true;
      }
      els.text.style.opacity = 1;
    });
  }

  function updateReaderChrome() {
    els.fill.style.width = `${Math.round(progressFraction(currentBook) * 100)}%`;
    els.jumpBtn.textContent = locationLabel(currentBook) + "  ▾";
    els.prev.disabled = isAtStart();
    els.next.disabled = isAtEnd();
  }

  function isAtStart() {
    if (currentBook === "gita") return progress.gita.chapter === 1 && progress.gita.verse === 1;
    if (currentBook === "quran") return progress.quran.surahIndex === 0 && progress.quran.ayah === 1;
    return progress.bible.bookIndex === 0 && progress.bible.chapter === 1 && progress.bible.verse === 1;
  }
  function isAtEnd() {
    if (currentBook === "gita") {
      const last = LIBRARY.gita.chapters.length;
      return progress.gita.chapter === last && progress.gita.verse === LIBRARY.gita.chapters[last - 1];
    }
    if (currentBook === "quran") {
      const s = LIBRARY.quran.surahs;
      return progress.quran.surahIndex === s.length - 1 && progress.quran.ayah === s[s.length - 1].verses;
    }
    const b = LIBRARY.bible.books;
    const lastBook = progress.bible.bookIndex === b.length - 1;
    const lastChapter = progress.bible.chapter === b[b.length - 1].chapters;
    if (!lastBook || !lastChapter) return false;
    const maxVerse = peekBibleChapterVerseCount(b[b.length - 1].key, progress.bible.chapter);
    return maxVerse ? progress.bible.verse >= maxVerse : false;
  }

  async function stepVerse(dir) {
    if (currentBook === "gita") stepGita(dir);
    else if (currentBook === "quran") stepQuran(dir);
    else await stepBible(dir);
    saveProgress();
    loadCurrentPassage();
  }

  function stepGita(dir) {
    const p = progress.gita;
    p.verse += dir;
    if (p.verse < 1) {
      if (p.chapter > 1) { p.chapter -= 1; p.verse = LIBRARY.gita.chapters[p.chapter - 1]; }
      else p.verse = 1;
    } else if (p.verse > LIBRARY.gita.chapters[p.chapter - 1]) {
      if (p.chapter < LIBRARY.gita.chapters.length) { p.chapter += 1; p.verse = 1; }
      else p.verse = LIBRARY.gita.chapters[p.chapter - 1];
    }
  }
  function stepQuran(dir) {
    const p = progress.quran;
    const surahs = LIBRARY.quran.surahs;
    p.ayah += dir;
    if (p.ayah < 1) {
      if (p.surahIndex > 0) { p.surahIndex -= 1; p.ayah = surahs[p.surahIndex].verses; }
      else p.ayah = 1;
    } else if (p.ayah > surahs[p.surahIndex].verses) {
      if (p.surahIndex < surahs.length - 1) { p.surahIndex += 1; p.ayah = 1; }
      else p.ayah = surahs[p.surahIndex].verses;
    }
  }
  async function stepBible(dir) {
    const p = progress.bible;
    const books = LIBRARY.bible.books;
    const maxVerse = await getBibleChapterVerseCount(books[p.bookIndex].key, p.chapter);
    p.verse += dir;
    if (p.verse < 1) {
      if (p.chapter > 1) {
        p.chapter -= 1;
        p.verse = await getBibleChapterVerseCount(books[p.bookIndex].key, p.chapter);
      } else if (p.bookIndex > 0) {
        p.bookIndex -= 1;
        p.chapter = books[p.bookIndex].chapters;
        p.verse = await getBibleChapterVerseCount(books[p.bookIndex].key, p.chapter);
      } else {
        p.verse = 1;
      }
    } else if (p.verse > maxVerse) {
      if (p.chapter < books[p.bookIndex].chapters) {
        p.chapter += 1; p.verse = 1;
      } else if (p.bookIndex < books.length - 1) {
        p.bookIndex += 1; p.chapter = 1; p.verse = 1;
      } else {
        p.verse = maxVerse;
      }
    }
  }

  els.prev.addEventListener("click", () => stepVerse(-1));
  els.next.addEventListener("click", () => stepVerse(1));

  // Swipe gestures on the verse stage
  let touchStartX = null, touchStartY = null;
  els.stage.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  els.stage.addEventListener("touchend", e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      stepVerse(dx < 0 ? 1 : -1);
    }
    touchStartX = null;
  }, { passive: true });

  // Keyboard arrows for desktop
  document.addEventListener("keydown", e => {
    if (views.reader.hidden) return;
    if (e.key === "ArrowRight") stepVerse(1);
    if (e.key === "ArrowLeft") stepVerse(-1);
  });

  /* ---------------------------------------------------------
     Jump-to sheet
  --------------------------------------------------------- */
  const jumpBackdrop = document.getElementById("jump-backdrop");
  const jumpList = document.getElementById("jump-list");
  const jumpTitle = document.getElementById("jump-title");

  els.jumpBtn.addEventListener("click", () => {
    jumpList.innerHTML = "";
    if (currentBook === "gita") {
      jumpTitle.textContent = "Jump to a chapter";
      jumpList.className = "jump-list";
      LIBRARY.gita.chapters.forEach((count, i) => {
        const btn = document.createElement("button");
        btn.className = "jump-item" + (progress.gita.chapter === i + 1 ? " active" : "");
        btn.textContent = i + 1;
        btn.title = LIBRARY.gita.chapterTitles[i];
        btn.addEventListener("click", () => {
          progress.gita.chapter = i + 1; progress.gita.verse = 1;
          saveProgress(); jumpBackdrop.hidden = true; loadCurrentPassage();
        });
        jumpList.appendChild(btn);
      });
    } else if (currentBook === "quran") {
      jumpTitle.textContent = "Jump to a surah";
      jumpList.className = "jump-list is-list";
      LIBRARY.quran.surahs.forEach((s, i) => {
        const btn = document.createElement("button");
        btn.className = "jump-item is-row" + (progress.quran.surahIndex === i ? " active" : "");
        btn.innerHTML = `<span>${s.n}. ${s.english} <small style="opacity:.6">(${s.name})</small></span><span>${s.verses} ayahs</span>`;
        btn.addEventListener("click", () => {
          progress.quran.surahIndex = i; progress.quran.ayah = 1;
          saveProgress(); jumpBackdrop.hidden = true; loadCurrentPassage();
        });
        jumpList.appendChild(btn);
      });
    } else {
      jumpTitle.textContent = "Jump to a book";
      jumpList.className = "jump-list is-list";
      LIBRARY.bible.books.forEach((b, i) => {
        const btn = document.createElement("button");
        btn.className = "jump-item is-row" + (progress.bible.bookIndex === i ? " active" : "");
        btn.innerHTML = `<span>${b.name}</span><span>${b.chapters} chapters</span>`;
        btn.addEventListener("click", () => {
          progress.bible.bookIndex = i; progress.bible.chapter = 1; progress.bible.verse = 1;
          saveProgress(); jumpBackdrop.hidden = true; loadCurrentPassage();
        });
        jumpList.appendChild(btn);
      });
    }
    jumpBackdrop.hidden = false;
  });
  document.getElementById("btn-jump-close").addEventListener("click", () => { jumpBackdrop.hidden = true; });
  jumpBackdrop.addEventListener("click", e => { if (e.target === jumpBackdrop) jumpBackdrop.hidden = true; });

  /* ---------------------------------------------------------
     Share
  --------------------------------------------------------- */
  document.getElementById("btn-share").addEventListener("click", async () => {
    const shareData = {
      title: `Ekayana — ${LIBRARY[currentBook].name}`,
      text: `"${els.text.textContent}"\n— ${els.ref.textContent}, ${LIBRARY[currentBook].name}`,
      url: "https://spiritual.books.suvadipchakraborty.workers.dev/",
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast("Verse copied to clipboard");
      }
    } catch { /* user cancelled */ }
  });

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "calc(90px + env(safe-area-inset-bottom,0px))", left: "50%",
      transform: "translateX(-50%)", background: "var(--ink)", color: "var(--bg)",
      padding: "10px 18px", borderRadius: "999px", fontSize: "0.85rem", zIndex: 999,
      opacity: 0, transition: "opacity .25s ease",
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = 1; });
    setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 1800);
  }

  /* ---------------------------------------------------------
     Footer feedback mailto
  --------------------------------------------------------- */
  const feedbackLink = document.getElementById("feedback-link");
  feedbackLink.href = `mailto:suvadipchakraborty@gmail.com?subject=${encodeURIComponent("Ekayana feedback")}&body=${encodeURIComponent("Hi Suva,\n\nI was using Ekayana and wanted to share:\n\n")}`;

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  applySettings();
  renderHome();
  showView("home");

  // Warm the cache for all three texts shortly after first paint, so the
  // service worker has them on disk and every text opens instantly (and
  // offline) even before the user has visited it once.
  window.addEventListener("load", () => {
    setTimeout(() => {
      ["gita", "quran", "bible"].forEach(id => loadBookData(id).catch(() => {}));
    }, 1200);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  });
})();
