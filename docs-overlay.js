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
  const html = marked.parse(md);

  // expects these exact MD headers:
  // ## English
  // ## العربية
  const parts = html.split(/<h2>English<\/h2>|<h2>العربية<\/h2>/);

  const enPart = (parts[1] || '').trim();
  const arPart = (parts[2] || '').trim();

  // fallback: if split fails, just render everything as-is
  if (!enPart && !arPart) {
    body.innerHTML = html;
    return;
  }

  body.innerHTML = `
    <div class="md-en">${enPart}</div>
    <div class="md-ar">${arPart}</div>
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
    } catch (err) {
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
