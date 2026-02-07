const MANIFEST_URL = "/archive/manifest.json";
const CSV_BASE = "/archive/";
const switcher = document.getElementById('period-switcher');
const logo = document.getElementById('logo');
let isSwitcherVisible = window.innerWidth >= 600; // initial state
const menuCloseButton = document.querySelector('.menu-close-btn');


const els = {
  grid: document.getElementById("grid"),
  npTitle: document.getElementById("npTitle"),
  npMeta: document.getElementById("npMeta"),
  status: document.getElementById("status"),
  switcher: document.getElementById("period-switcher"),
};

let activeVideoId = null;
let currentIndex = 0;
let currentList = [];
let ytPlayer = null;
let isPlayerReady = false;

// Helpers
const getLang = () => localStorage.getItem('lang') || 'ar';
const isAr = () => getLang() === 'ar';

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('player', {
    height: '100%', width: '100%', videoId: '',
    playerVars: { 'autoplay': 1, 'playsinline': 1, 'modestbranding': 1, 'rel': 0, 'controls': 0 },
    events: {
      'onStateChange': (e) => { if (e.data === YT.PlayerState.ENDED) playNext(); },
      'onReady': () => {
        isPlayerReady = true;
        if (currentList.length > 0 && !activeVideoId) playItem(currentList[0]);
      }
    }
  });
}

function playNext() {
  if (currentList.length === 0) return;
  playItem(currentList[(currentIndex + 1) % currentList.length]);
}

function playPrev() {
  if (currentList.length === 0) return;
  playItem(currentList[(currentIndex - 1 + currentList.length) % currentList.length]);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const parseLine = (line) => {
    const out = []; let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && line[i+1] === '"') { cur += '"'; i++; } 
        else inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) { out.push(cur); cur = ""; } 
      else cur += line[i];
    }
    out.push(cur); return out;
  };
  const header = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const o = {};
    header.forEach((h, idx) => { o[h] = vals[idx]?.trim() ?? ""; });
    return o;
  });
}

function formatKMB(val) {
  const n = parseFloat(String(val ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return "";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toString();
}

function extractVideoId(val) {
  if (!val) return null;
  const m = val.match(/(?:v=|youtu\.be\/)([^?&]+)/);
  return m ? m[1] : val;
}

function playItem(item) {
  if (!item) return;
  const id = extractVideoId(item.VideoID);
  if (!id) return;
  activeVideoId = id;
  currentIndex = currentList.findIndex(r => extractVideoId(r.VideoID) === id);

  if (isPlayerReady && ytPlayer?.loadVideoById) ytPlayer.loadVideoById(id);

  const parts = item.Title.split(" | ");
  const enT = parts[0];
  const arT = parts[1] || parts[0];

// Inside playItem(item)
els.npTitle.innerHTML = `
  <span>${item.Rank}</span>
  <div class="lang-en" style="display: ${isAr() ? 'none' : 'block'}">${escapeHtml(enT)}</div>
  <div class="lang-ar" style="display: ${isAr() ? 'block' : 'none'}">${escapeHtml(arT)}</div>
`;

// Inside initFromCsv loop
card.innerHTML = `
  <img src="${r.Thumbnail}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumb'">
  <div class="cardBody">
    <div class="cardRank">#${r.Rank || (idx + 1)} <span>• ${views}</span></div>
    <div class="cardTitle">
      <div class="lang-en" style="display: ${isAr() ? 'none' : 'block'}">${escapeHtml(enT)}</div>
      <div class="lang-ar" style="display: ${isAr() ? 'block' : 'none'}">${escapeHtml(arT)}</div>
    </div>
  </div>`;

// Inside renderSwitcher loop
btn.innerHTML = `
  <div class="lang-en" style="display: ${isAr() ? 'none' : 'block'}">${escapeHtml(titleEn)}</div>
  <div class="lang-ar" style="display: ${isAr() ? 'block' : 'none'}">${escapeHtml(titleAr)}</div>
`;

// IMPORTANT: After every loop/render finishes, add this:
if (typeof showLang === 'function') showLang(getLang());

  const vShort = formatKMB(item.Views);
  els.npMeta.innerHTML = `
    <span class="lang-en" style="display: ${isAr() ? 'none' : 'inline'}">Views: ${vShort}</span>
    <span class="lang-ar" style="display: ${isAr() ? 'inline' : 'none'}">المشاهدات: ${vShort}</span>
  `;
  els.npMeta.classList.remove('hidden');
  
  document.querySelectorAll('.card').forEach(c => c.classList.toggle('active', c.getAttribute('data-id') === id));
  
  // Handshake with lang.js
  if (typeof showLang === 'function') showLang(getLang());
}

async function initFromCsv(csvUrl) {
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();
    currentList = parseCSV(text)
      .filter(r => r.VideoID?.length > 5)
      .sort((a, b) => (parseInt(a.Rank) || 999) - (parseInt(b.Rank) || 999));

    els.grid.innerHTML = "";
    currentList.forEach((r, idx) => {
      const id = extractVideoId(r.VideoID);
      const views = formatKMB(r.Views);
      const parts = r.Title.split(" | ");
      const enT = parts[0];
      const arT = parts[1] || parts[0];

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-id", id);
      card.onclick = () => playItem(r);
      card.innerHTML = `
        <img src="${r.Thumbnail}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumb'">
        <div class="cardBody">
          <div class="cardRank">#${r.Rank || (idx + 1)} <span>• ${views}</span></div>
          <div class="cardTitle">
            <span class="lang-en" style="display: ${isAr() ? 'none' : 'inline'}">${escapeHtml(enT)}</span>
            <span class="lang-ar" style="display: ${isAr() ? 'inline' : 'none'}">${escapeHtml(arT)}</span>
          </div>
        </div>`;
      els.grid.appendChild(card);
    });

    if (isPlayerReady && currentList.length > 0) playItem(currentList[0]);
    
    // Handshake with lang.js
    if (typeof showLang === 'function') showLang(getLang());

  } catch (err) { console.error(err); }
}

function renderSwitcher(manifest, activeItem) {
  if (!els.switcher) return;
  // els.switcher.innerHTML = "";
  els.switcher.querySelectorAll(".period-btn, a.period-btn").forEach(b => b.remove());


  manifest.filter(x => x.status === "ready" && x.featured).forEach(item => {
    const btn = document.createElement("button");
    btn.className = `period-btn ${item === activeItem ? 'active' : ''}`;
    const titleEn = item.title || "";
    const titleAr = item.title_ar || titleEn;

    btn.innerHTML = `
      <div class="lang-en center" style="display: ${isAr() ? 'none' : 'inline'}">${escapeHtml(titleEn)}</div>
      <div class="lang-ar center" style="display: ${isAr() ? 'inline' : 'none'}">${escapeHtml(titleAr)}</div>
    `;
    btn.onclick = () => {
      els.switcher.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyPeriod(item);
      closeSwitcher(); 
    };
    els.switcher.appendChild(btn);
  });

  const archiveBtn = document.createElement("a");
  archiveBtn.href = "/archive/";
  archiveBtn.className = "period-btn";
  archiveBtn.innerHTML = `
    <span class="lang-en" style="display: ${isAr() ? 'none' : 'inline'}">More Rankings</span>
    <span class="lang-ar" style="display: ${isAr() ? 'inline' : 'none'}">المزيد من الترتيبات</span>
  `;
  els.switcher.appendChild(archiveBtn);

  // Handshake with lang.js
  if (typeof showLang === 'function') showLang(getLang());
}

async function applyPeriod(item) {
  const cover = document.querySelector(".intro .cover");
  if (cover && item.banner) cover.src = item.banner;
  await initFromCsv(CSV_BASE + item.file);
}

async function init() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    const manifest = await res.json();
    const item = manifest.find(x => x.status === "ready" && x.default) || manifest.find(x => x.status === "ready");
    if (item) {
      renderSwitcher(manifest, item);
      await applyPeriod(item);
    }
  } catch (err) { console.error(err); }
}

// UI and Navigation
document.getElementById('logo')?.addEventListener('click', () => {
  if (window.innerWidth < 600) els.switcher?.classList.toggle('hidden');
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") playNext();
  if (e.key === "ArrowLeft") playPrev();
});

 
function updateSwitcherVisibility() {
  if (!switcher) return;

  if (window.innerWidth < 600) {
    // Mobile: hide switcher and close button by default
    switcher.classList.add('hidden');
    isSwitcherVisible = false;
    if (menuCloseButton) menuCloseButton.classList.add('hidden');
  } else {
    // Desktop: show switcher, hide close button
    switcher.classList.remove('hidden');
    isSwitcherVisible = true;
    if (menuCloseButton) menuCloseButton.classList.add('hidden');
  }
}

// logo click opens menu on mobile only
logo?.addEventListener('click', () => {
  if (window.innerWidth < 600) {
    switcher.classList.remove('hidden');
    if (menuCloseButton) menuCloseButton.classList.remove('hidden'); 
  }
});

// close button hides menu
function closeSwitcher() {
  if (!switcher || !menuCloseButton) return;
  switcher.classList.add('hidden');
  isSwitcherVisible = false;
  menuCloseButton.classList.add('hidden');
}

// Attach it to the button
menuCloseButton?.addEventListener('click', closeSwitcher);


// initialize
init().then(() => {
  updateSwitcherVisibility();
});



window.addEventListener("resize", () => {
  if (!switcher) return;

  if (window.innerWidth >= 600) {
    // Desktop: show period switcher
    switcher.classList.remove("hidden");
    isSwitcherVisible = true;
    if (menuCloseButton) menuCloseButton.classList.add("hidden"); // keep X hidden
  } else {
    // Mobile: hide period switcher
    switcher.classList.add("hidden");
    isSwitcherVisible = false;
    if (menuCloseButton) menuCloseButton.classList.add("hidden"); // X hidden by default
  }
});

