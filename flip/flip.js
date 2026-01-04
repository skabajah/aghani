// /flip/flip.js
// Reads Year2025.csv, shows ONE song, bilingual meta lines, no VideoID displayed.
// Supports tap-to-flip + optional auto flip/advance via URL params.

const CSV_URL = "../Year2025.csv";

let songs = [];
let index = 0;

let stopTimer = null;

const START_AT = 60;   // 1:00
const PLAY_FOR = 5;   // seconds


const els = {
  bg: document.getElementById("bgBackdrop"),
  flipCard: document.getElementById("flipCard"),
  tapArea: document.getElementById("tapArea"),
  rank: document.getElementById("rankNum"),
  title: document.getElementById("songTitle"),
  views: document.getElementById("viewsVal"),
  pub: document.getElementById("pubVal"),
};

let ytPlayer = null;
let isPlayerReady = false;
let pendingVideoId = null;

// ---------- helpers (same behavior as app.js) ----------
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCount(val) {
  if (val == null) return NaN;
  const s = String(val).trim();
  if (!s) return NaN;
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

// robust CSV parser (same style as your app.js)
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

// ---------- flip ----------
// function doFlip(){
//   els.flipCard.classList.add("isAnimating");
//   els.flipCard.classList.toggle("isFlipped");
//   setTimeout(() => els.flipCard.classList.remove("isAnimating"), 750);
// }
// els.tapArea.addEventListener("click", doFlip);
// els.flipCard.addEventListener("click", doFlip);
// ---------- flip (animation + next song) ----------
function doFlip(){
  if (els.flipCard.classList.contains("isAnimating")) return;

  els.flipCard.classList.add("isAnimating", "isFlipped");

  // switch song at mid-flip
  setTimeout(nextSong, 420);

  // reset for next flip
  setTimeout(() => {
    els.flipCard.classList.remove("isFlipped");
    els.flipCard.classList.remove("isAnimating");
  }, 850);
}

els.tapArea.addEventListener("click", doFlip);
els.flipCard.addEventListener("click", doFlip);

// ---------- render ----------
function setBackdrop(urlOrId, thumbUrl){
  // prefer CSV thumbnail if present
  if (els.bg) {
    if (thumbUrl) els.bg.style.backgroundImage = `url(${thumbUrl})`;
    else if (urlOrId) els.bg.style.backgroundImage = `url(https://i.ytimg.com/vi/${encodeURIComponent(urlOrId)}/maxresdefault.jpg)`;
  }
}


function loadIntoPlayer(videoId){
  if (!videoId) return;

  if (!isPlayerReady || !ytPlayer) {
    pendingVideoId = videoId;
    return;
  }

  if (typeof ytPlayer.loadVideoById === "function") {
    ytPlayer.loadVideoById({
      videoId,
      startSeconds: START_AT
    });
  } else {
    ytPlayer.cueVideoById({
      videoId,
      startSeconds: START_AT
    });
    ytPlayer.playVideo();
  }

  // stop after 5 seconds
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
      ytPlayer.pauseVideo();
    }
  }, PLAY_FOR * 1000);
}


function showSong(i){
  if (!songs.length) return;
  const item = songs[i];

  const rank = item.Rank || String(i + 1);
  const id = extractVideoId(item.VideoID);
  const titleHtml = escapeHtml(item.Title || "").replaceAll(" | ", "<br>");

  const viewsShort = formatKMB(item.Views);
  const viewsLine = viewsShort
    ? `Views • <span dir="ltr">${viewsShort}</span> • المشاهدات`
    : "";

  const pubLine = item.PublishDate
    ? `Published • <span dir="ltr">${escapeHtml(item.PublishDate)}</span> • تاريخ النشر`
    : "";

  els.rank.textContent = rank;

  // allow <br> like your app.js
  els.title.innerHTML = titleHtml;

  // bilingual meta lines (no VideoID displayed)
  els.views.innerHTML = viewsLine;
  els.pub.innerHTML = pubLine;

  setBackdrop(id, item.Thumbnail);
  loadIntoPlayer(id);
}

function nextSong(){
  if (!songs.length) return;
  index = (index + 1) % songs.length;
  els.flipCard.classList.remove("isFlipped");
  showSong(index);
}

// ---------- load ----------
async function loadCSV(){
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  songs = parseCSV(text)
    .filter(r => r.VideoID && r.VideoID.length > 5)
    .sort((a, b) => (parseInt(a.Rank) || 999) - (parseInt(b.Rank) || 999));

  showSong(0);
}

// ---------- optional auto mode ----------
function setupAuto(){
  const qp = new URLSearchParams(location.search);
  const autoflip = qp.get("autoflip") === "1";
  const autosong = qp.get("autosong") === "1";
  const interval = Math.max(900, Number(qp.get("interval") || 2500));

  if (autoflip && autosong){
    setInterval(() => {
      doFlip();
      setTimeout(nextSong, 900);
    }, interval);
  } else if (autoflip){
    setInterval(doFlip, interval);
  } else if (autosong){
    setInterval(nextSong, interval);
  }
}

// ---------- YouTube ----------
window.onYouTubeIframeAPIReady = function(){
  ytPlayer = new YT.Player("player", {
    height: "100%",
    width: "100%",
    videoId: "",
    playerVars: {
      autoplay: 1,
      playsinline: 1,
      modestbranding: 1,
      rel: 0,
      controls: 0
    },
    events: {
      onReady: () => {
        isPlayerReady = true;
        if (pendingVideoId) {
          const vid = pendingVideoId;
          pendingVideoId = null;
          loadIntoPlayer(vid);
        }
      }
    }
  });
};

// init
loadCSV().then(setupAuto).catch(err => console.error(err));
