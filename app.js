const MANIFEST_URL = "/archive/manifest.json";
const CSV_BASE = "/archive/";
const switcher = document.getElementById('period-switcher');
const logo = document.getElementById('logo');
const menuCloseButton = document.querySelector('.menu-close-btn');
const languageButtonApp = document.querySelectorAll('.lang-switcher button');

const grid = document.getElementById("grid");
const npTitle = document.getElementById("npTitle");
const npMeta = document.getElementById("npMeta");
const status = document.getElementById("status");
 
let mobile_view = window.innerWidth >= 600; // initial state
let activeVideoId = null;
let currentIndex = 0;
let currentList = [];
let ytPlayer = null;
let isPlayerReady = false;

// Helpers
const getLang = () => localStorage.getItem('lang') || 'ar';
const isAr = () => getLang() === 'ar';

let lastManifest = [];
let lastActiveItem = null;
let lastCsvUrl = ""; // To store the current CSV path

// functions 
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: '',
    playerVars: {
      'autoplay': 1,
      'playsinline': 1,
      'modestbranding': 1,
      'rel': 0,
      'controls': 0 

    },
    events: {
      'onStateChange': (e) => { 
        if (e.data === YT.PlayerState.ENDED) playNext(); 
      },
      'onReady': () => {
        isPlayerReady = true;
        setStatus("Ready");
        if (currentList.length > 0 && !activeVideoId) {
          playItem(currentList[0]);
        }
      },
      'onError': (e) => {
        console.error("YouTube Player Error:", e.data);
        setStatus("Playback Error");
      }
    }
  });
}

function playNext() {
  if (currentList.length === 0) return;
  const next = (currentIndex + 1) % currentList.length;
  playItem(currentList[next]);
}

function playPrev() {
  if (currentList.length === 0) return;
  const prev = (currentIndex - 1 + currentList.length) % currentList.length;
  playItem(currentList[prev]);
}

function setStatus(msg) {
  if ( status)  status.textContent = msg;
}

function escapeHtml(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  
  const parseLine = (line) => {
    const out = []; let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } 
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; } 
      else cur += ch;
    }
    out.push(cur); return out;
  };

  const header = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const o = {};
    header.forEach((h, idx) => { o[h] = vals[idx] ? vals[idx].trim() : ""; });
    return o;
  });
}

// function formatMillions(val) {
//   if (!val) return "";
//   const num = Number(val.replace(/,/g, ''));
//   if (isNaN(num)) return "";
//   return (num / 1000000).toFixed(1) + "M";
// }

function parseCount(val) {
  if (val == null) return NaN;
  const s = String(val).trim();
  if (!s) return NaN;

  // supports raw numbers, "123,456", and optional suffix like "1.2M", "900K", "3B"
  const m = s.match(/^([\d.,]+)\s*([KMB])?$/i);
  if (!m) return NaN;

  const n = Number(m[1].replace(/,/g, ""));
  if (Number.isNaN(n)) return NaN;

  const suf = (m[2] || "").toUpperCase();
  const mult = suf === "K" ? 1e3 : suf === "M" ? 1e6 : suf === "B" ? 1e9 : 1;
  return n * mult;
}

function formatKMB(val) {
  const n = parseCount(val);
  if (!Number.isFinite(n)) return "";

  const abs = Math.abs(n);
  const fmt = (x) => {
    const out = (Math.round(x * 10) / 10).toFixed(1);
    return out.endsWith(".0") ? out.slice(0, -2) : out;
  };

  if (abs >= 1e9) return `${fmt(n / 1e9)}B`;
  if (abs >= 1e6) return `${fmt(n / 1e6)}M`;
  if (abs >= 1e3) return `${fmt(n / 1e3)}K`;
  return `${Math.round(n)}`;
}



function extractVideoId(val) {
  if (!val) return null;
  if (val.includes("v=")) return val.split("v=")[1].split("&")[0];
  if (val.includes("youtu.be/")) return val.split("youtu.be/")[1].split("?")[0];
  return val;
}

function playItem(item) {
  if (!item) return;
  const id = extractVideoId(item.VideoID);
  if (!id) return;
  
  activeVideoId = id;
  currentIndex = currentList.findIndex(r => extractVideoId(r.VideoID) === id);

  if (isPlayerReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(id);
  }
   
  // const npTitleHtml = escapeHtml(item.Title).replaceAll(" | ", "<br>");
  const [enT, arT] = escapeHtml(item.Title).split(" | ");
  npTitle.innerHTML = `
    <span>${item.Rank}</span>
    <div class="lang-en" style="display: ${isAr() ? 'none' : 'block'}">${enT}</div>
    <div class="lang-ar" style="display: ${isAr() ? 'block' : 'none'}">${arT}</div>
  `;
  // npTitle.innerHTML = `<span>${item.Rank}</span> ${npTitleHtml}`;
 
  const viewsShort = formatKMB(item.Views);
  const viewsLine = viewsShort ? `Views • <span dir="ltr">${viewsShort}</span> • المشاهدات` : "";
  const pubLine = item.PublishDate ? `Published • <span dir="ltr">${item.PublishDate}</span> • تاريخ النشر` : "";
  npMeta.innerHTML = `${viewsLine}`;

  
  document.querySelectorAll('.card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-id') === id);
  });
}

async function initFromCsv(csvUrl) {
  setStatus("Loading Data...");
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();

    currentList = parseCSV(text)
      .filter(r => r.VideoID && r.VideoID.length > 5)
      .sort((a, b) => (parseInt(a.Rank) || 999) - (parseInt(b.Rank) || 999));

    if (currentList.length === 0) throw new Error("No videos found.");

     grid.innerHTML = "";

    currentList.forEach((r, idx) => {
      const id = extractVideoId(r.VideoID);
      const viewCount = formatKMB(r.Views);

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-id", id);
      card.onclick = () => playItem(r);

    //   card.innerHTML = `
    //     <img src="${r.Thumbnail}" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumb'">
    //     <div class="cardBody">
    //       <div class="cardRank">#${r.Rank || (idx + 1)} <span>• ${viewCount}</span></div>
    //       <div class="cardTitle">${escapeHtml(r.Title).replaceAll(" | ", "<br>")}</div>
    //     </div>`;
    //    grid.appendChild(card);
    // });
    const [en, ar] = escapeHtml(r.Title).split(" | ");
    card.innerHTML = `
        <img src="${r.Thumbnail}" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumb'">
        <div class="cardBody">
          <div class="cardRank">#${r.Rank || (idx + 1)} <span>• ${viewCount}</span></div>
           <div class="cardTitle">
            <div class="lang-en" style="display: ${isAr() ? 'none' : 'block'}">${en}</div>
            <div class="lang-ar" style="display: ${isAr() ? 'block' : 'none'}">${ar}</div>
          </div>
        </div>`;
       grid.appendChild(card);
    });




    activeVideoId = null;
    currentIndex = 0;

    if (isPlayerReady) playItem(currentList[0]);

  } catch (err) {
    console.error("Init Error:", err);
    setStatus("Load Error");
     grid.innerHTML = `<div style="padding:40px; color:#ff4444; text-align:center;">Error: ${err.message}</div>`;
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") playNext();
  if (e.key === "ArrowUp") playPrev();
});

async function applyPeriod(item) {

  closeMobileMenu();

  if (!item) return;

  const cover = document.querySelector(".intro .cover");
  if (cover && item.banner) cover.src = item.banner;

  await initFromCsv(CSV_BASE + item.file);
}

function renderSwitcher(manifest, activeItem) {
  if (! switcher) return;

  switcher.innerHTML = "";

  manifest
    .filter(x => x.status === "ready" && x.featured)
    .forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "period-btn";

      // btn.textContent = item.title || "";
      // Select Arabic title if isAr() is true, otherwise use English title
      btn.textContent = isAr() ? (item.title_ar || item.title) : (item.title || "");

      if (item === activeItem) btn.classList.add("active");
      btn.onclick = async () => {
        // update active state
        switcher.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        await applyPeriod(item);
      };
       switcher.appendChild(btn);
    });

    // ADD THIS
  const archiveBtn = document.createElement("a");
  archiveBtn.href = "/archive/";
  archiveBtn.className = "period-btn";
  // archiveBtn.textContent = "More Rankings";
  archiveBtn.textContent = isAr() ? "الترتيبات السابقة" : "Previous Rankings";
  switcher.appendChild(archiveBtn);
}


async function initFromManifestDefault() {
  setStatus("Loading...");
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    const manifest = await res.json();

    const item =
      manifest.find(x => x.status === "ready" && x.default === true) ||
      manifest.find(x => x.status === "ready") ||
      null;

    if (!item) throw new Error("No ready items in manifest.");

    renderSwitcher(manifest, item);
    await applyPeriod(item);

  } catch (err) {
    console.error("Manifest init error:", err);
    setStatus("Load Error");
  }
  lastManifest = manifest;
  lastActiveItem = item;
}

initFromManifestDefault();

 

function updateScreenWidth() {
  if (!switcher) return;

  if (window.innerWidth < 600) {
    mobile_view = true;
    closeMobileMenu(); 

  } else {
    mobile_view = false;
  }
}

updateScreenWidth();
window.addEventListener('resize', updateScreenWidth);

function openMobileMenu() {
  if (mobile_view) {
    switcher?.classList.remove('hidden');
    menuCloseButton?.classList.remove('hidden');
  }
}
logo?.addEventListener('click', openMobileMenu);

// close button hides menu
function closeMobileMenu() {
  if (mobile_view) {
    switcher?.classList.add('hidden');
    menuCloseButton?.classList.add('hidden');
  }
}
menuCloseButton?.addEventListener('click', closeMobileMenu);
 


async function UpdateinnerHtmlLanguage() {
  initFromManifestDefault(); 
    // if (lastManifest && lastActiveItem) {
    //     renderSwitcher(lastManifest, lastActiveItem);
    //     await applyPeriod(lastActiveItem);
    // }
}

languageButtonApp.forEach(button => {
    button.addEventListener('click', () => {
        UpdateinnerHtmlLanguage();
    });
});