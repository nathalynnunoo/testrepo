/* Story data: an array of pages. Each page has title, text, and an emoji illustration. */
const storyPages = [
  { title: "Cover", text: "Sunny's Big Adventure", art: "🌞", cover: true },
  { title: "1 • Morning", text: "Sunny the squirrel woke up bright and early. Today felt special!", art: "🛏️" },
  { title: "2 • Packing Snacks", text: "Sunny packed crunchy acorns and a tiny water bottle.", art: "🥜" },
  { title: "3 • New Friend", text: "On the path, Sunny met a shy hedgehog named Hazel.", art: "🦔" },
  { title: "4 • The Tall Log", text: "They found a tall log bridge. It looked wobbly!", art: "🌉" },
  { title: "5 • Brave Steps", text: "Sunny held Hazel's paw. One step, two steps—they crossed!", art: "🤝" },
  { title: "6 • Picnic Time", text: "They shared acorns and stories under a leafy tree.", art: "🌳" },
  { title: "7 • A Cloud Dragon", text: "A fluffy cloud looked like a dragon waving hello.", art: "🐉" },
  { title: "8 • Race the Breeze", text: "They raced the wind all the way to the pond.", art: "🍃" },
  { title: "9 • Splish Splash", text: "Plip! Plop! Little fish made tiny circles.", art: "🐟" },
  { title: "10 • Homeward", text: "The sun yawned. It was time to head home.", art: "🌇" },
  { title: "The End", text: "Sunny waved goodbye. What a big, brave day!", art: "👋", end: true }
];

/* DOM refs */
const bookEl = document.getElementById("book");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const pageCounter = document.getElementById("pageCounter");
const progressDots = document.getElementById("progressDots");
const btnReadAloud = document.getElementById("btnReadAloud");
const btnAutoplay = document.getElementById("btnAutoplay");
const speedRange = document.getElementById("speedRange");
const btnNight = document.getElementById("btnNight");
const btnHelp = document.getElementById("btnHelp");
const helpDialog = document.getElementById("helpDialog");
const statusEl = document.getElementById("status");

/* State */
let currentPageIndex = 0; // 0-based
let readAloudEnabled = false;
let autoplayEnabled = false;
let isTurning = false;
let utterance = null;
let autoplayTimer = null;

/* Build pages stack */
const totalPages = storyPages.length;
storyPages.forEach((page, index) => {
  const pageEl = document.createElement("section");
  pageEl.className = "page";
  pageEl.dataset.index = String(index);
  pageEl.style.zIndex = String(totalPages - index);

  // Front side (what you read)
  const front = document.createElement("div");
  front.className = "side front";
  front.innerHTML = renderPageContent(page, index);

  // Back side (simple texture + page number)
  const back = document.createElement("div");
  back.className = "side back";
  back.innerHTML = `
    <div class="content">
      <div></div>
      <div></div>
      <footer>
        <span></span>
        <span>← Back</span>
      </footer>
    </div>
  `;

  pageEl.appendChild(front);
  pageEl.appendChild(back);
  bookEl.appendChild(pageEl);
});

/* Progress dots */
for (let i = 0; i < totalPages; i++) {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("role", "tab");
  dot.setAttribute("aria-label", `Go to page ${i + 1}`);
  dot.addEventListener("click", () => jumpToPage(i));
  progressDots.appendChild(dot);
}
updateUiState();

/* Event listeners */
nextBtn.addEventListener("click", nextPage);
prevBtn.addEventListener("click", prevPage);

btnReadAloud.addEventListener("click", () => {
  readAloudEnabled = !readAloudEnabled;
  btnReadAloud.setAttribute("aria-pressed", String(readAloudEnabled));
  statusEl.textContent = readAloudEnabled ? "Read‑aloud on" : "Read‑aloud off";
  if (!readAloudEnabled) cancelSpeech();
  if (readAloudEnabled) speakCurrentPage();
});

btnAutoplay.addEventListener("click", () => {
  autoplayEnabled = !autoplayEnabled;
  btnAutoplay.setAttribute("aria-pressed", String(autoplayEnabled));
  statusEl.textContent = autoplayEnabled ? "Autoplay on" : "Autoplay off";
  handleAutoplay();
});

btnNight.addEventListener("click", () => {
  const root = document.documentElement;
  const isNight = root.classList.toggle("night");
  btnNight.setAttribute("aria-pressed", String(isNight));
});

btnHelp.addEventListener("click", () => {
  helpDialog.showModal();
});

// Keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextPage();
  if (e.key === "ArrowLeft") prevPage();
});

// Touch swipe
let touchStartX = 0;
let touchStartY = 0;
bookEl.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX; touchStartY = t.clientY;
}, { passive: true });
bookEl.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
    if (dx < 0) nextPage(); else prevPage();
  }
}, { passive: true });

// Speed change
speedRange.addEventListener("input", () => {
  if (utterance) {
    // Restart speaking with new rate
    cancelSpeech();
    if (readAloudEnabled) speakCurrentPage();
  }
});

/* Small page turn sound (WebAudio) */
function playFlipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 420;
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    o.start();
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
    o.frequency.exponentialRampToValueAtTime(220, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.00001, now + 0.18);
    o.stop(now + 0.2);
  } catch (_) {}
}

/* Core actions */
function nextPage() {
  if (isTurning || currentPageIndex >= totalPages - 1) return;
  playFlipSound();
  isTurning = true;

  const pageEl = getPageEl(currentPageIndex);
  pageEl.classList.add("flipped");

  currentPageIndex += 1;
  updateUiState();

  setTimeout(() => { isTurning = false; if (readAloudEnabled) speakCurrentPage(); handleAutoplay(); }, 820);
}

function prevPage() {
  if (isTurning || currentPageIndex <= 0) return;
  playFlipSound();
  isTurning = true;

  currentPageIndex -= 1;
  const pageEl = getPageEl(currentPageIndex);
  pageEl.classList.remove("flipped");

  updateUiState();

  setTimeout(() => { isTurning = false; if (readAloudEnabled) speakCurrentPage(); handleAutoplay(); }, 820);
}

function jumpToPage(index) {
  if (index === currentPageIndex) return;
  // Flip or unflip pages to reach target
  const step = index > currentPageIndex ? 1 : -1;
  const doStep = () => {
    if (currentPageIndex === index) return finish();
    if (step > 0) {
      const pageEl = getPageEl(currentPageIndex);
      pageEl.classList.add("flipped");
      currentPageIndex += 1;
    } else {
      currentPageIndex -= 1;
      const pageEl = getPageEl(currentPageIndex);
      pageEl.classList.remove("flipped");
    }
    updateUiState();
    setTimeout(doStep, 100);
  };
  const finish = () => {
    if (readAloudEnabled) speakCurrentPage();
    handleAutoplay();
  };
  doStep();
}

function getPageEl(index) {
  return bookEl.querySelector(`.page[data-index="${index}"]`);
}

function updateUiState() {
  // Update z-index so that the next page is always on top
  const pages = [...bookEl.querySelectorAll(".page")];
  pages.forEach((p, i) => {
    const base = totalPages - i;
    p.style.zIndex = String(base + (i < currentPageIndex ? -1000 : 0));
  });

  // Progress counter and dots
  pageCounter.value = `Page ${currentPageIndex + 1} of ${totalPages}`;
  [...progressDots.children].forEach((dot, i) => {
    dot.setAttribute("aria-selected", String(i === currentPageIndex));
  });

  // Nav enablement
  prevBtn.disabled = currentPageIndex === 0;
  nextBtn.disabled = currentPageIndex === totalPages - 1;
}

/* Rendering */
function renderPageContent(page, index) {
  const pageNum = index + 1;
  const isCover = !!page.cover;
  const isEnd = !!page.end;
  const subtitle = isCover ? "Storybook" : (isEnd ? "Fin" : "");
  const artAlt = `${page.title} illustration`;
  return `
    <div class="content" role="article" aria-label="Page ${pageNum}">
      <header>
        <h2>${escapeHtml(page.title)}</h2>
        ${subtitle ? `<div>${escapeHtml(subtitle)}</div>` : ""}
      </header>
      <div class="art" aria-label="${escapeHtml(artAlt)}" role="img">${escapeHtml(page.art || "")}</div>
      <p data-narration>${escapeHtml(page.text)}</p>
      <footer>
        <span></span>
        <span>${pageNum}</span>
      </footer>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
}

/* Read‑aloud with SpeechSynthesis */
function speakCurrentPage() {
  cancelSpeech();
  const pageEl = getPageEl(currentPageIndex);
  if (!pageEl) return;
  const textEl = pageEl.querySelector('[data-narration]');
  if (!textEl) return;
  const text = textEl.textContent || "";

  if (!window.speechSynthesis) return;
  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = parseFloat(speedRange.value) || 1;
  utterance.pitch = 1.0;
  utterance.onend = () => { utterance = null; if (autoplayEnabled) scheduleNextAuto(); };
  try { window.speechSynthesis.speak(utterance); } catch (e) { console.warn("Speech failed:", e); utterance = null; }
}

function cancelSpeech() {
  if (utterance && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }
  utterance = null;
}

/* Autoplay */
function handleAutoplay() {
  clearTimeout(autoplayTimer);
  if (!autoplayEnabled) return;
  if (readAloudEnabled) {
    // If speaking, onend will trigger next
    if (!utterance) speakCurrentPage();
  } else {
    scheduleNextAuto();
  }
}

function scheduleNextAuto() {
  clearTimeout(autoplayTimer);
  if (currentPageIndex >= totalPages - 1) return;
  const baseDelay = 3000; // 3s per page without speech
  const rate = parseFloat(speedRange.value) || 1;
  const delay = baseDelay / rate;
  autoplayTimer = setTimeout(() => { nextPage(); }, delay);
}

/* Accessibility: restore last page */
(function restoreProgress() {
  const saved = Number(localStorage.getItem("kidsBook.page"));
  if (Number.isFinite(saved) && saved >= 0 && saved < totalPages) {
    jumpToPage(saved);
  }
})();

window.addEventListener("beforeunload", () => {
  localStorage.setItem("kidsBook.page", String(currentPageIndex));
});