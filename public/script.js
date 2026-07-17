/* ============================================================
   Jessica Salgado — Script
   Small, self-contained interactions. Written in vanilla JS so
   it can be embedded directly inside a Blogger XML template
   without any build step.
   ============================================================ */

(function () {
  'use strict';

  /* --------------------------------------------------------
     Theme toggle (moon / sun)
     -------------------------------------------------------- */
  var themeToggle = document.querySelector('.theme-toggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('theme-dark');

      var icon = themeToggle.querySelector('i');
      if (!icon) return;
      icon.classList.toggle('fa-moon');
      icon.classList.toggle('fa-sun');
    });
  }

  /* --------------------------------------------------------
     Favorite (heart) toggle on article cards
     -------------------------------------------------------- */
  var favoriteButtons = document.querySelectorAll('.favorite-button');

  favoriteButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      button.classList.toggle('is-active');

      var icon = button.querySelector('i');
      if (!icon) return;
      icon.classList.toggle('fa-regular');
      icon.classList.toggle('fa-solid');
    });
  });

  /* --------------------------------------------------------
     Research Areas carousel — arrow scroll
     -------------------------------------------------------- */
  var carouselArrow = document.querySelector('.carousel-arrow');
  var carouselTrack = document.querySelector('.research-areas__track');

  if (carouselArrow && carouselTrack) {
    carouselArrow.addEventListener('click', function () {
      carouselTrack.scrollBy({ left: 240, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------------
     Scroll indicator — jump to next section
     -------------------------------------------------------- */
  var scrollIndicator = document.querySelector('.scroll-indicator');
  var researchSection = document.querySelector('.research-areas');

  if (scrollIndicator && researchSection) {
    scrollIndicator.addEventListener('click', function () {
      researchSection.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();
