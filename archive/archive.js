(() => {
  const root = document.getElementById("archiveRoot");
  if (!root) return;

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

      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === "," && !q) {
        out.push(cur);
        cur = "";
        continue;
      }
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

  const renderSnapshot = (item, headers, rows) => {
    const section = document.createElement("section");
    section.style.marginBottom = "40px";

    section.innerHTML = `
      ${item.banner ? `<img src="${esc(item.banner)}" style="width:100%;border-radius:12px;margin-bottom:12px">` : ""}
      <h2>${esc(item.title)}</h2>

      <div style="margin-bottom:10px">
        ${item.playlist_url ? `<a href="${esc(item.playlist_url)}" target="_blank" rel="noopener">YouTube Playlist</a>` : ""}
        ${item.playlist_url && item.ranking_video_url ? " · " : ""}
        ${item.ranking_video_url ? `<a href="${esc(item.ranking_video_url)}" target="_blank" rel="noopener">Ranking Video</a>` : ""}
      </div>

      <table>
        <thead>
          <tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>${headers.map((_, i) => `<td>${esc(r[i] ?? "")}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    `;

    root.appendChild(section);
  };

  const load = async () => {
    const manifest = await fetch("/archive/manifest.json", { cache: "no-store" })
      .then(r => r.json());

    manifest.sort((a, b) => (b.month || "").localeCompare(a.month || ""));

    for (const item of manifest) {
      // Only render "ready" snapshots
      if (item.status !== "ready") continue;

      const res = await fetch(`/archive/${item.file}`, { cache: "no-store" });
      if (!res.ok) continue; // missing csv -> skip

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
