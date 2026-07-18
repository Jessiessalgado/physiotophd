// Theme toggle
const themeBtn = document.querySelector('.theme-toggle');
themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const icon = themeBtn.querySelector('i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
});

// Favorite toggle
document.querySelectorAll('.fav-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    btn.classList.toggle('active');
    const i = btn.querySelector('i');
    i.classList.toggle('fa-regular');
    i.classList.toggle('fa-solid');
  });
});

// Carousel arrow
const track = document.querySelector('.areas-track');
document.querySelector('.carousel-arrow')?.addEventListener('click', () => {
  track?.scrollBy({ left: 240, behavior: 'smooth' });
});

// Scroll down
document.querySelector('.scroll-down')?.addEventListener('click', () => {
  document.querySelector('.research-areas')?.scrollIntoView({ behavior: 'smooth' });
});
