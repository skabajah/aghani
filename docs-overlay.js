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

function applyBidi() {
  let currentDir = 'ltr';

  Array.from(body.children).forEach(el => {
    // switch direction when hitting language headers
    if (/^H\d$/.test(el.tagName)) {
      const t = el.textContent.trim();
      if (t === 'English') currentDir = 'ltr';
      if (t === 'العربية') currentDir = 'rtl';
    }

    el.style.direction = currentDir;
    el.style.textAlign = currentDir === 'rtl' ? 'right' : 'left';
  });
}

document.querySelectorAll('.docLink').forEach(a => {
  a.addEventListener('click', async (e) => {
    e.preventDefault();

    const file = a.dataset.md || a.getAttribute('href');

    try {
      const res = await fetch(file, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const md = await res.text();

      // render MD ONCE — no splitting
      body.innerHTML = marked.parse(md);

      // then fix direction per section
      applyBidi();

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

 