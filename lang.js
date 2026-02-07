// 1. Move showLang outside so app.js can "talk" to it
function showLang(lang) {
    const isAr = lang === 'ar';
    
    // Toggle visibility
    document.querySelectorAll('.lang-en, .lang-ar').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.lang-' + lang).forEach(el => {
        // Use block for divs/p, inline for spans
        el.style.display = (el.tagName === 'SPAN') ? 'inline' : 'block';
    });
    
    document.documentElement.lang = lang;

    const topbar = document.querySelector('.topbar'); // Added this
    const footer = document.querySelector('.footer-content');
    const switcher = document.getElementById('period-switcher');
    const listMain = document.querySelector('.list-main');
    const nowPlaying = document.getElementById('nowPlaying'); 
    const langSwitcher = document.querySelector('.lang-switcher');
    const menuCloseButton = document.querySelector('.menu-close-btn');

    const enBtn = document.querySelector('.lang-switcher button[data-lang="en"]');
    const arBtn = document.querySelector('.lang-switcher button[data-lang="ar"]');

    if (enBtn && arBtn) {
        enBtn.classList.toggle('active', lang === 'en');
        arBtn.classList.toggle('active', lang === 'ar');
    }

    // Consolidate layout flips
    if (topbar) topbar.classList.toggle('flip', isAr); // Added this
    if (footer) footer.classList.toggle('flip', isAr);
    if (switcher) switcher.classList.toggle('flip', isAr);
    if (listMain) listMain.classList.toggle('flip', isAr);
    if (nowPlaying) nowPlaying.classList.toggle('flip', isAr); 
    if (langSwitcher) langSwitcher.classList.toggle('flip', isAr); 
    if (menuCloseButton) menuCloseButton.classList.toggle('flip', isAr); 

}

// 2. Main Event Listener
document.addEventListener('DOMContentLoaded', () => {
    let currentLang = localStorage.getItem('lang') || 'ar';

    // Initial run
    showLang(currentLang);

    // Click listeners for the buttons
    document.querySelectorAll('.lang-switcher button').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            // Get current active state from the document
            const activeLang = localStorage.getItem('lang') || 'ar';
            
            if (lang === activeLang) return; 

            localStorage.setItem('lang', lang);
            showLang(lang);
        });
    });
});