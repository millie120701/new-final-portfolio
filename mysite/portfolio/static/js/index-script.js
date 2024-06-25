var toggle = document.querySelector(".hamburger-menu");

toggle.addEventListener("click", toggleMenu);

function toggleMenu() {
  var nav = document.querySelector(".primary-navigation");

  nav.classList.toggle("active");

  toggle.classList.toggle("active");
  mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.classList.toggle("hidden");
  }
  frontContainer = document.querySelector(".front-container");
  if (frontContainer) {
    frontContainer.classList.toggle("hidden");
  }

  projectsContent = document.querySelector(".projects-content");
  if (projectsContent) {
    projectsContent.classList.toggle("hidden");
  }
}
