// docs-overlay.js

const overlay = document.getElementById('docOverlay');
const body = document.getElementById('docBody');
const closeBtn = document.getElementById('docClose');

function openDoc() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeDoc() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  body.innerHTML = '';
}

function renderBilingual(md) {
  // Keep headers as-is by splitting the raw Markdown (not the rendered HTML)
  const parts = md.split(/(?=^##\s+English\b|^##\s+العربية\b)/m);

  let enMd = '';
  let arMd = '';

  for (const p of parts) {
    const s = p.trimStart();
    if (s.startsWith('## English')) enMd = p;
    if (s.startsWith('## العربية')) arMd = p;
  }

  // Fallback: if sections aren't found, just render everything normally
  if (!enMd && !arMd) {
    body.innerHTML = marked.parse(md);
    return;
  }

  const enHtml = enMd ? marked.parse(enMd) : '';
  const arHtml = arMd ? marked.parse(arMd) : '';

  body.innerHTML = `
    <div class="md-en">${enHtml}</div>
    <div class="md-ar">${arHtml}</div>
  `;
}

document.querySelectorAll('.docLink').forEach(a => {
  a.addEventListener('click', async (e) => {
    e.preventDefault();

    const file = a.dataset.md || a.getAttribute('href');

    try {
      const res = await fetch(file, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const md = await res.text();
      renderBilingual(md);
      openDoc();
    } catch {
      body.innerHTML = `<p>Failed to load: ${file}</p>`;
      openDoc();
    }
  });
});

closeBtn.addEventListener('click', closeDoc);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeDoc();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDoc();
});




// const overlay = document.getElementById('docOverlay');
// const body = document.getElementById('docBody');
// const closeBtn = document.getElementById('docClose');

// function openDoc() {
//   overlay.classList.remove('hidden');
//   overlay.setAttribute('aria-hidden', 'false');
// }

// function closeDoc() {
//   overlay.classList.add('hidden');
//   overlay.setAttribute('aria-hidden', 'true');
//   body.innerHTML = '';
// }

// document.querySelectorAll('.docLink').forEach(a => {
//   a.addEventListener('click', async (e) => {
//     e.preventDefault();

//     const file = a.dataset.md;
//     const res = await fetch(file, { cache: 'no-cache' });

//     if (!res.ok) {
//       body.innerHTML = '<p>Failed to load.</p>';
//       openDoc();
//       return;
//     }

//     const md = await res.text();
//     body.innerHTML = marked.parse(md);

//     const hasArabic = /[\u0600-\u06FF]/.test(md);
//     body.style.direction = hasArabic ? 'rtl' : 'ltr';
//     body.style.textAlign = hasArabic ? 'right' : 'left';

//     openDoc();
//   });
// });

// closeBtn.addEventListener('click', closeDoc);
// overlay.addEventListener('click', (e) => {
//   if (e.target === overlay) closeDoc();
// });
// document.addEventListener('keydown', (e) => {
//   if (e.key === 'Escape') closeDoc();
// });
