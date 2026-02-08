const currentLanguage = localStorage.getItem('lang') || 'ar';

const languageButton = document.querySelectorAll('.lang-switcher button');

const englishElements = document.querySelectorAll('.lang-en');
const arabicElements = document.querySelectorAll('.lang-ar');

const flippableElements = document.querySelectorAll(
    '.topbar, ' +            // Class
    '.footer-content, ' +    // Class
    '#period-switcher, ' +   // ID
    '.list-main, ' +         // Class
    '#nowPlaying, ' +        // ID
    '.lang-switcher, ' +     // Class
    '.menu-close-btn'        // Class
);

function switchLanguage(language) {
    if (language === 'ar') {
        englishElements.forEach(element => {
            element.classList.add('hidden');
        });
        arabicElements.forEach(element => {
            element.classList.remove('hidden');
        });
        localStorage.setItem('lang', 'ar');
    } else {
        englishElements.forEach(element => {
            element.classList.remove('hidden');
        });
        arabicElements.forEach(element => {
            element.classList.add('hidden');
        });
        localStorage.setItem('lang', 'en');
    }
}

function flipDirection(language) {
    if (language === 'ar') {
        flippableElements.forEach(element => {
            element.classList.add('flip');
        });
    } else {
        flippableElements.forEach(element => {
            element.classList.remove('flip');
        });
    }
}

function updateActiveButton(language) {
    languageButton.forEach(button => {
        if (button.dataset.lang === language) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Initial Run: Set the page state based on stored or default language
switchLanguage(currentLanguage);
flipDirection(currentLanguage);
updateActiveButton(currentLanguage);

// Click Listeners
languageButton.forEach(button => {
    button.addEventListener('click', () => {
        const selectedLanguage = button.dataset.lang;
        switchLanguage(selectedLanguage);
        flipDirection(selectedLanguage);
        updateActiveButton(selectedLanguage);
    });
});