// ===============================
// ACTIVE NAVIGATION LINK
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-links a");
  const currentPath =
    window.location.pathname.replace(/^\/|\/$/g, "") || "index";

  navLinks.forEach((link) => {
    const href = link.getAttribute("href").replace(/^\/|\/$/g, "") || "index";
    if (href === currentPath) link.classList.add("active");
  });
});

// ===============================
// MOBILE MENU + OVERLAY HANDLING
// ===============================
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const overlay = document.querySelector(".nav-overlay");

// Helper: Close menu
function closeMenu() {
  navLinks?.classList.remove("open");
  overlay?.classList.remove("active");
  document.body.classList.remove("no-scroll");
  const icon = menuToggle?.querySelector(".material-icons-round");
  if (icon) icon.textContent = "menu";
}

// Helper: Open menu
function openMenu() {
  navLinks?.classList.add("open");
  overlay?.classList.add("active");
  document.body.classList.add("no-scroll");
  const icon = menuToggle?.querySelector(".material-icons-round");
  if (icon) icon.textContent = "close";
}

if (menuToggle && navLinks && overlay) {
  // Toggle menu
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navLinks.classList.contains("open") ? closeMenu() : openMenu();
  });

  // Close menu when clicking overlay
  overlay.addEventListener("click", closeMenu);

  // Close menu when clicking any link
  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
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
    if (e.key === "Escape") closeMenu();
  });
}

// ===============================
// APPLY BACKGROUND
// ===============================
function applyBackground(url, size = null, repeat = false) {
  const body = document.body.style;

  if (!url) {
    // No background
    document.body.removeAttribute("style");
    localStorage.setItem(
      "customBackground",
      JSON.stringify({ url: "", repeat: false })
    );
    return;
  }

  body.backgroundImage = `url('${url}')`;

  if (repeat) {
    // Pattern backgrounds
    body.backgroundRepeat = "repeat";
    body.backgroundSize = size || "auto";
    body.backgroundPosition = "top left";
    body.backgroundAttachment = "scroll";
  } else {
    // Full backgrounds
    body.backgroundRepeat = "no-repeat";
    body.backgroundSize = "cover";
    body.backgroundPosition = "center center";
    body.backgroundAttachment = "fixed";
  }

  localStorage.setItem(
    "customBackground",
    JSON.stringify({ url, size, repeat })
  );
}

// ===============================
// APPLY THEME
// ===============================
function applyTheme(name, smooth = false) {
  const theme = window.themes?.[name];
  if (!theme) return;

  const root = document.documentElement;

  const applyVars = () => {
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
      applyVars();
      document.body.style.opacity = 1;
    }, 300);
  } else {
    applyVars();
  }

  localStorage.setItem("selectedTheme", name);
}
