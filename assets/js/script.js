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

if (menuToggle && navLinks && overlay) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    overlay.classList.toggle("active", isOpen);

    // Change the icon (menu ↔ close)
    const icon = menuToggle.querySelector(".material-icons-round");
    if (icon) icon.textContent = isOpen ? "close" : "menu";
  });

  // Close menu if user clicks outside (on overlay)
  overlay.addEventListener("click", () => {
    navLinks.classList.remove("open");
    overlay.classList.remove("active");

    // Reset icon to menu
    const icon = menuToggle.querySelector(".material-icons-round");
    if (icon) icon.textContent = "menu";
  });
}

// Background preference handling
const body = document.body;
const bgOptions = document.querySelectorAll(".bg-option");

function applyBackground(url, size, repeat = false) {
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
