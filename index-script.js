var toggle = document.querySelector(".hamburger-menu");

toggle.addEventListener("click", toggleMenu);

function toggleMenu() {
  var nav = document.querySelector(".primary-navigation");
  var languages = document.querySelector(".languages-section");
  nav.classList.toggle("active");
  languages.classList.toggle("active");
  toggle.classList.toggle("active");
}
