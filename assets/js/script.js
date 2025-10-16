// Highlight active navigation link based on current page
const navLinks = document.querySelectorAll("nav a");
const currentPath = window.location.pathname.replace(/^\/|\/$/g, "") || "index";

for (const link of navLinks) {
  const href = link.getAttribute("href").replace(/^\/|\/$/g, "") || "index";
  if (href === currentPath) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
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
