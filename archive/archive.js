(() => {
  const root = document.getElementById("archiveRoot");
  if (!root) return;

  const SHOW_COLS = ["Rank", "Thumbnail", "Title", "Views", "PublishDate"];
  const IMAGE_COL = "Thumbnail";
  const LINK_COL  = "Link";

  const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );

  const syncFlipState = (target) => {
    const footer = document.querySelector('.footer-content');
    if (footer && footer.classList.contains('flip')) {
      target.classList.add('flip');
      target.style.direction = 'rtl';
    } else {
      target.classList.remove('flip');
      target.style.direction = 'ltr';
    }
  };

  const splitCSV = (line) => {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { q = !q; continue; }
      if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const parseCSV = (text) => {
    const lines = text.replace(/\r/g, "").trim().split("\n").filter(Boolean);
    return {
      headers: splitCSV(lines[0] || ""),
      rows: lines.slice(1).map(splitCSV),
    };
  };

  const formatMillions = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return esc(v);
    return (n / 1e6).toFixed(1) + "M";
  };

 const renderSnapshot = (item, headers, rows) => {
    const cols = SHOW_COLS.filter(c => headers.includes(c));
    const section = document.createElement("section");
    section.className = "list about";

    const currentLang = localStorage.getItem("lang") || "ar";
    const isArActive = currentLang === "ar";
    
    syncFlipState(section);

    // Headers from JSON: 'title' for EN, 'title_ar' for AR
    const headerEn = item.title || "Ranking";
    const headerAr = item.title_ar || item.title || "الترتيب";

    const snapshotDate = String(item.snapshot_date);
    const yt_en = [], yt_ar = [];

    if (item.playlist_url) {
      yt_en.push(`<a href="${esc(item.playlist_url)}" target="_blank" rel="noopener">YouTube Playlist</a>`);
      yt_ar.push(`<a href="${esc(item.playlist_url)}" target="_blank" rel="noopener">قائمة يوتيوب</a>`);
    }
    if (item.ranking_video_url) {
      yt_en.push(`<a href="${esc(item.ranking_video_url)}" target="_blank" rel="noopener">Ranking Video</a>`);
      yt_ar.push(`<a href="${esc(item.ranking_video_url)}" target="_blank" rel="noopener">فيديو الترتيب</a>`);
    }
    if (item.snapshot_date) {
      yt_en.push(`<span>Released ${esc(item.snapshot_date)}</span>`);
      yt_ar.push(`<span>نسخة ${esc(item.snapshot_date)}</span>`);
    }


    const linksHtml = `
      <div class="lang-en" style="display: ${isArActive ? 'none' : 'block'}">
        ${yt_en.join(" | ")}
      </div>
      <div class="lang-ar" style="display: ${isArActive ? 'block' : 'none'}">
        ${yt_ar.join(" | ")}
      </div>
    `;


    section.innerHTML = `
      
      <h2 class="lang-en" style="display: ${isArActive ? 'none' : 'block'}">${esc(headerEn)}</h2>
      <h2 class="lang-ar" style="display: ${isArActive ? 'block' : 'none'}">${esc(headerAr)}</h2>
      
      ${item.banner ? `<img class="cover" src="${esc(item.banner)}">` : ""}
      <h5 class="archive-links">${linksHtml}</h5>
      <table>
        <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${cols.map(c => {
                const i = headers.indexOf(c);
                const val = i > -1 ? (row[i] ?? "") : "";
                if (c === IMAGE_COL && val) {
                  const linkIdx = headers.indexOf(LINK_COL);
                  const href = linkIdx > -1 ? (row[linkIdx] ?? "#") : "#";
                  return `<td><a href="${esc(href)}" target="_blank" rel="noopener"></a>
                          <img src="${esc(val)}" style="display:block"></td>`;
                }
                if (c === "Title") {
                  const linkIdx = headers.indexOf(LINK_COL);
                  const href = linkIdx > -1 ? (row[linkIdx] ?? "") : "";
                  const enT = headers.includes("Title_EN") ? row[headers.indexOf("Title_EN")] : val.split(" | ")[0];
                  const arT = headers.includes("Title_AR") ? row[headers.indexOf("Title_AR")] : val.split(" | ")[1] || val;
                  const enH = enT ? `<span class="lang-en" style="display:${isArActive ? "none" : "inline"}">${esc(enT)}</span>` : "";
                  const arH = arT ? `<span class="lang-ar" style="display:${isArActive ? "inline" : "none"}">${esc(arT)}</span>` : "";
                  return `<td class="song-title">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${enH}${arH}</a>` : `${enH}${arH}`}</td>`;
                }
                if (c === "Views") return `<td>${formatMillions(val)}</td>`;
                return `<td>${esc(val)}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    root.appendChild(section);
    const btn = document.querySelector(`.lang-switcher button[data-lang="${currentLang}"]`);
    if (btn) btn.click();
  };

  const load = async () => {
    const resM = await fetch("/archive/manifest.json", { cache: "no-store" });
    const manifest = await resM.json();
    manifest.sort((a, b) => {
      if ((a.year ?? 0) !== (b.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
      if (a.period !== b.period) return a.period === "year" ? -1 : 1;
      return (b.month || "").localeCompare(a.month || "");
    });

    for (const item of manifest) {
      if (item.status !== "ready") continue;
      const resC = await fetch(`/archive/${item.file}`, { cache: "no-store" });
      if (!resC.ok) continue;
      const csv = await resC.text();
      const { headers, rows } = parseCSV(csv);
      renderSnapshot(item, headers, rows);
    }
  };

  const observer = new MutationObserver(() => {
    document.querySelectorAll('#archiveRoot section').forEach(syncFlipState);
  });
  const footer = document.querySelector('.footer-content');
  if (footer) observer.observe(footer, { attributes: true, attributeFilter: ['class'] });

  load().catch(err => {
    root.innerHTML = `<p style="color:#b00020">Archive failed to load</p>`;
    console.error(err);
  });
})();