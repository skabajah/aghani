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

document.querySelectorAll('.docLink').forEach(a => {
  a.addEventListener('click', async (e) => {
    e.preventDefault();

    const file = a.dataset.md;
    const res = await fetch(file, { cache: 'no-cache' });

    if (!res.ok) {
      body.innerHTML = '<p>Failed to load.</p>';
      openDoc();
      return;
    }

    const md = await res.text();
    body.innerHTML = marked.parse(md);

    const hasArabic = /[\u0600-\u06FF]/.test(md);
    body.style.direction = hasArabic ? 'rtl' : 'ltr';
    body.style.textAlign = hasArabic ? 'right' : 'left';

    openDoc();
  });
});

closeBtn.addEventListener('click', closeDoc);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeDoc();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDoc();
});
