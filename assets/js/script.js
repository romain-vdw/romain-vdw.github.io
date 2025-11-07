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
// Theme and Background Handling (global)
// ===============================

// Global storage for themes and backgrounds
window.themes = {};
window.backgrounds = [];

// ---- Apply Background ----
function applyBackground(url, size, repeat = false) {
  const body = document.body;
  if (!url || url === "none") {
    body.style.backgroundImage = "none";
    body.style.backgroundColor = "var(--bg-color)";
  } else {
    body.style.backgroundImage = `url('${url}')`;
  }

  if (repeat) {
    body.style.backgroundSize = size || "auto";
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

// ---- Apply Theme ----
function applyTheme(name, smooth = false) {
  const theme = window.themes?.[name];
  if (!theme) return;

  const root = document.documentElement;
  const apply = () => {
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--bg-color", theme.bgColor);
    root.style.setProperty("--bg1-color", theme.bg1Color);
    root.style.setProperty("--text-color", theme.textColor);
    root.style.setProperty("--inverse-text-color", theme.inverseTextColor);
  };

  if (smooth) {
    document.body.style.transition = "opacity 0.3s ease";
    document.body.style.opacity = 0;
    setTimeout(() => {
      apply();
      document.body.style.opacity = 1;
    }, 300);
  } else {
    apply();
  }

  localStorage.setItem("selectedTheme", name);
}

// ---- Load Saved Settings ----
function loadSettings() {
  const savedTheme = localStorage.getItem("selectedTheme");
  if (savedTheme && window.themes[savedTheme]) applyTheme(savedTheme);

  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) {
    try {
      const { url, size, repeat } = JSON.parse(savedBg);
      applyBackground(url, size, repeat);
    } catch (e) {
      console.error("Failed to parse background settings:", e);
    }
  }
}

// ---- Load themes/backgrounds JSON globally ----
async function preloadSettingsData() {
  try {
    const [themeData, bgData] = await Promise.all([
      fetch("/assets/data/themes.json").then((r) => r.json()),
      fetch("/assets/data/backgrounds.json").then((r) => r.json()),
    ]);

    window.themes = themeData;
    window.backgrounds = bgData;

    // Apply saved user settings after data is ready
    loadSettings();
  } catch (err) {
    console.error("Failed to load settings data:", err);
  }
}

document.addEventListener("DOMContentLoaded", preloadSettingsData);
