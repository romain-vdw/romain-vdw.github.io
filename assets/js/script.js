// ===============================
// Highlight Active Navigation Link
// ===============================
const navLinksA = document.querySelectorAll(".nav-links a");
const currentPath = window.location.pathname.replace(/^\/|\/$/g, "") || "index";

for (const link of navLinksA) {
  const href = link.getAttribute("href").replace(/^\/|\/$/g, "") || "index";
  if (href === currentPath) link.classList.add("active");
}

// ===============================
// Mobile Menu + Overlay Handling
// ===============================
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const overlay = document.querySelector(".nav-overlay");

// Helper: Close menu
function closeMenu() {
  if (!navLinks) return;
  navLinks.classList.remove("open");
  overlay?.classList.remove("active");
  document.body.classList.remove("no-scroll");
  const icon = menuToggle?.querySelector(".material-icons-round");
  if (icon) icon.textContent = "menu";
}

// Helper: Open menu
function openMenu() {
  if (!navLinks) return;
  navLinks.classList.add("open");
  overlay?.classList.add("active");
  document.body.classList.add("no-scroll");
  const icon = menuToggle?.querySelector(".material-icons-round");
  if (icon) icon.textContent = "close";
}

if (menuToggle && navLinks && overlay) {
  // Toggle menu
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.contains("open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close menu when clicking overlay
  overlay.addEventListener("click", () => closeMenu());

  // Close menu when clicking any link
  navLinks.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !navLinks.contains(e.target) &&
      !menuToggle.contains(e.target) &&
      navLinks.classList.contains("open")
    ) {
      closeMenu();
    }
  });

  // Close menu with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) closeMenu();
  });
}

// ===============================
// Background preference handling
// ===============================
const bgOptions = document.querySelectorAll(".bg-option");

function applyBackground(url, size, repeat = false) {
  const body = document.body;
  body.style.backgroundImage = url ? `url('${url}')` : "none";

  if (repeat) {
    body.style.backgroundSize = size;
    body.style.backgroundRepeat = "repeat";
  } else {
    body.style.backgroundSize = "cover";
    body.style.backgroundRepeat = "no-repeat";
  }
  localStorage.setItem(
    "customBackground",
    JSON.stringify({ url, size, repeat })
  );
}

function loadBackground() {
  const saved = localStorage.getItem("customBackground");
  if (!saved) return;
  try {
    const { url, size, repeat } = JSON.parse(saved);
    applyBackground(url, size, repeat);
  } catch (e) {
    console.error("Failed to parse saved background:", e);
  }
}

for (const option of bgOptions) {
  option.addEventListener("click", () => {
    const url = option.dataset.bg;
    const size = option.dataset.size;
    const repeat = option.dataset.repeat === "true";
    applyBackground(url, size, repeat);
  });
}

loadBackground();
