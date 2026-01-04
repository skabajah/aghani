// /flip/flip.js
// Loads the same Top-20 CSV from root, shows ONE song, supports tap-to-flip and optional auto-advance.

const CSV_URL = "../Year2025.csv"; // adjust if your CSV name differs

let songs = [];
let index = 0;

const els = {
  bg: document.getElementById("bgBackdrop"),
  flipCard: document.getElementById("flipCard"),
  tapArea: document.getElementById("tapArea"),
  rank: document.getElementById("rankNum"),
  title: document.getElementById("songTitle"),
  views: document.getElementById("viewsVal"),
  pub: document.getElementById("pubVal"),
  id: document.getElementById("idVal"),
};

let ytPlayer = null;

// ---------- flip ----------
function doFlip(){
  els.flipCard.classList.add("isAnimating");
  els.flipCard.classList.toggle("isFlipped");
  setTimeout(() => els.flipCard.classList.remove("isAnimating"), 750);
}

els.tapArea.addEventListener("click", doFlip);
els.flipCard.addEventListener("click", doFlip);

// ---------- CSV parsing ----------
function splitCSVLine(line){
  // split by commas but keep quoted commas
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.trim());
}

function stripQuotes(s){
  if (!s) return "";
  return s.replace(/^"|"$/g, "");
}

function parseCSV(text){
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(stripQuotes);

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line).map(stripQuotes);
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? "");
    return obj;
  });
}

// ---------- render ----------
function setBackdrop(videoId){
  els.bg.style.backgroundImage =
    `url(https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg)`;
}

function showSong(i){
  if (!songs.length) return;

  const s = songs[i];

  // Expected column names:
  // Rank, Views, Title, VideoID, PublishDate
  const rank = s.Rank || String(i + 1);
  const title = s.Title || "";
  const views = s.Views || "";
  const pub = s.PublishDate || "";
  const id = s.VideoID || "";

  els.rank.textContent = rank;
  els.title.textContent = title;
  els.views.textContent = views;
  els.pub.textContent = pub;
  els.id.textContent = id;

  if (id) setBackdrop(id);
  if (ytPlayer && id) ytPlayer.loadVideoById(id);
}

function nextSong(){
  index = (index + 1) % songs.length;
  // ensure front side before switching content (for clean recordings)
  els.flipCard.classList.remove("isFlipped");
  showSong(index);
}

// ---------- load ----------
async function loadCSV(){
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  songs = parseCSV(text);

  // If Rank exists, sort by Rank numeric (keeps top20 order stable)
  if (songs.length && songs[0].Rank){
    songs.sort((a,b) => Number(a.Rank) - Number(b.Rank));
  }

  showSong(0);
}

// ---------- optional auto mode for recording ----------
function getQP(){
  return new URLSearchParams(location.search);
}

function setupAuto(){
  const qp = getQP();
  const autoflip = qp.get("autoflip") === "1";
  const autosong = qp.get("autosong") === "1";
  const interval = Math.max(900, Number(qp.get("interval") || 2500));

  // Example:
  // /flip/?autoflip=1&autosong=1&interval=2500
  if (autoflip && autosong){
    setInterval(() => {
      doFlip();
      setTimeout(() => nextSong(), 900);
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
    }
  });
};

// init
loadCSV().then(setupAuto).catch(err => {
  console.error(err);
});
