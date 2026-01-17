(() => {
  const root = document.getElementById("archiveRoot");
  if (!root) return;

  // Render only these columns (order controlled here)
  const SHOW_COLS = ["Rank", "Thumbnail", "Title", "Views", "PublishDate"];

  const IMAGE_COL = "Thumbnail";
  const LINK_COL  = "Link";

  const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );

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

    // const links = [
    //   item.playlist_url ? `<a href="${esc(item.playlist_url)}" target="_blank" rel="noopener">YouTube Playlist</a>` : "",
    //   item.ranking_video_url ? `<a href="${esc(item.ranking_video_url)}" target="_blank" rel="noopener">Ranking Video</a>` : "",
    //   item.snapshot_date ? `Snapshot: ${esc(item.snapshot_date)}` : ""
    // ].filter(Boolean).join(" | ");

    const links = [
      item.playlist_url ? `<a href="${esc(item.playlist_url)}" target="_blank" rel="noopener">YouTube Playlist</a> قائمة يوتيوب` : "",
      item.ranking_video_url ? `<a href="${esc(item.ranking_video_url)}" target="_blank" rel="noopener">Ranking Video</a> فيديو الترتيب` : "",
      // item.snapshot_date ? `Release نسخة: ${esc(item.snapshot_date)}` : ""
      item.snapshot_date ? `Release نسخة: ${item.snapshot_date}` : ""

    ].filter(Boolean).join(" | ");


    section.innerHTML = `
      <br><hr><h3>${esc(item.title)}</h3>
      ${item.banner ? `<img class="cover" src="${esc(item.banner)}" >` : ""}
      ${links ? `<h5 class="archive-links">${links}</h5>` : ""}

      <table>
        <thead>
          <tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${cols.map(c => {
                const i = headers.indexOf(c);
                const val = i > -1 ? (r[i] ?? "") : "";

                if (c === IMAGE_COL && val) {
                  const linkIdx = headers.indexOf(LINK_COL);
                  const href = linkIdx > -1 ? (r[linkIdx] ?? "#") : "#";
                  return `
                    <td>
                      <a href="${esc(href)}" target="_blank" rel="noopener">
                        <img src="${esc(val)}" style="width:70px;border-radius:6px;display:block">
                      </a>
                    </td>
                  `;
                }

                if (c === "Title") {
                  const linkIdx = headers.indexOf(LINK_COL);
                  const href = linkIdx > -1 ? (r[linkIdx] ?? "") : "";
                  return href
                    ? `<td class="song-title"><a href="${esc(href)}" target="_blank" rel="noopener">${esc(val)}</a></td>`
                    : `<td class="song-title">${esc(val)}</td>`;
                }

                if (c === "Views") {
                  return `<td>${formatMillions(val)}</td>`;
                }

                return `<td>${esc(val)}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    root.appendChild(section);
  };

  const load = async () => {
    const manifest = await fetch("/archive/manifest.json", { cache: "no-store" })
      .then(r => r.json());

    // manifest.sort((a, b) => (b.month || "").localeCompare(a.month || ""));
    manifest.sort((a, b) => {
      // newest year first
      if ((a.year ?? 0) !== (b.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);

      // year summary before months
      if (a.period !== b.period) return a.period === "year" ? -1 : 1;

      // months newest → oldest
      if (a.period === "month") {
        return (b.month || "").localeCompare(a.month || "");
      }

      return 0;
    });

    for (const item of manifest) {
      // Only render snapshots explicitly marked ready
      if (item.status !== "ready") continue;

      const res = await fetch(`/archive/${item.file}`, { cache: "no-store" });
      if (!res.ok) continue;

      const csv = await res.text();
      const { headers, rows } = parseCSV(csv);
      renderSnapshot(item, headers, rows);
    }
  };

  load().catch(err => {
    root.innerHTML = `<p style="color:#b00020">Archive failed to load</p>`;
    console.error(err);
  });
})();
