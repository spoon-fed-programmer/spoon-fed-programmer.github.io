const toggleButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");

if (toggleButton && nav) {
  toggleButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (nav && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      if (toggleButton) {
        toggleButton.setAttribute("aria-expanded", "false");
      }
    }
  });
});
