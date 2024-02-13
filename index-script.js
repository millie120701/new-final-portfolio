var toggle = document.querySelector(".hamburger-menu");

toggle.addEventListener("click", toggleMenu);

function toggleMenu() {
  var nav = document.querySelector(".primary-navigation");
  nav.classList.toggle("active");
  toggle.classList.toggle("active");
}
