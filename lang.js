// --- Language switcher ---
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = localStorage.getItem('lang') || 'ar';
  let isArActive = currentLang === 'ar';

  function showLang(lang) {
    document.querySelectorAll('.lang-en, .lang-ar').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.lang-' + lang).forEach(el => el.style.display = 'block');
    document.documentElement.lang = lang;

    // Update buttons' active state
    const enBtn = document.querySelector('.lang-switcher button[data-lang="en"]');
    const arBtn = document.querySelector('.lang-switcher button[data-lang="ar"]');
    enBtn.classList.toggle('active', lang === 'en');
    arBtn.classList.toggle('active', lang === 'ar');
  }

  showLang(currentLang);

  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if ((lang === 'ar' && isArActive) || (lang === 'en' && !isArActive)) return; // already active
      isArActive = lang === 'ar';
      localStorage.setItem('lang', lang);
      showLang(lang);
    });
  });
});


