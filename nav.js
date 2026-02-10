const openBtn = document.querySelector('.menu-btn');
const closeBtn = document.querySelector('.menu-close');
const nav = document.querySelector('.mobile-nav');

openBtn.addEventListener('click', () => {
  nav.classList.add('open');
});

closeBtn.addEventListener('click', () => {
  nav.classList.remove('open');
});
