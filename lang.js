// --- Language switcher ---
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = localStorage.getItem('lang') || 'ar';
  let isArActive = currentLang === 'ar';

  function showLang(lang) {
    document.querySelectorAll('.lang-en, .lang-ar').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.lang-' + lang).forEach(el => el.style.display = 'block');
    document.documentElement.lang = lang;

    // const footer = document.querySelector('.footer-content');
    const footer = document.querySelector('.footer-content');
    const enBtn = document.querySelector('.lang-switcher button[data-lang="en"]');
    const arBtn = document.querySelector('.lang-switcher button[data-lang="ar"]');

    if (lang === 'en') {
      enBtn.classList.add('active');
      arBtn.classList.remove('active');
      footer.classList.remove('flip');
    } else {
      console.log("ar detected")
      arBtn.classList.add('active');
      enBtn.classList.remove('active');
      footer.classList.add('flip');
    }



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


