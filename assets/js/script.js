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
// STARFIELD UTILITIES
// ===============================

/**
 * removeStarfield()
 * Removes any full-screen starfield canvas injected by applyAnimatedStarfield.
 */
function removeStarfield() {
  const old = document.getElementById("starfield-canvas");
  if (old) old.remove();
}

/**
 * applyAnimatedStarfield(options)
 * Creates a full screen canvas and starts animation. Clears previous starfield first.
 * options = { type, count, colors, sizeRange, speedRange, layers }
 */
function applyAnimatedStarfield(name, options = null) {
  removeStarfield();

  const canvas = document.createElement("canvas");
  canvas.id = "starfield-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.imageRendering = "pixelated";
  document.body.appendChild(canvas);

  if (!options) {
    const savedBg = JSON.parse(
      localStorage.getItem("customBackground") || "{}"
    );
    options = savedBg.options || {
      type: "pixel",
      count: 250,
      colors: ["#fff"],
      sizeRange: [2, 4],
      speedRange: [0.1, 1],
    };
  }

  startStarfieldFull(canvas, options);

  // Save full background selection with name
  localStorage.setItem(
    "customBackground",
    JSON.stringify({ name, type: "animated-canvas", options })
  );
}

/**
 * startStarfieldFull(canvas, options)
 * Fullscreen starfield engine with variants
 */
function startStarfieldFull(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  let stars = [];

  if (options.type === "parallax") {
    // Multiple layers
    options.layers.forEach((layer, i) => {
      for (let j = 0; j < layer.count; j++) {
        const colorArray = layer.colors || ["#fff"];
        stars.push({
          layer: i,
          x: (Math.random() * canvas.width) / DPR,
          y: (Math.random() * canvas.height) / DPR,
          size:
            layer.sizeRange[0] +
            Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
          speedX: (Math.random() - 0.5) * layer.speedMultiplier,
          speedY: (Math.random() - 0.5) * layer.speedMultiplier,
          color: colorArray[Math.floor(Math.random() * colorArray.length)],
        });
      }
    });
  } else {
    const count = options.count || 250;
    for (let i = 0; i < count; i++) {
      const sizeRange = options.sizeRange || [2, 4];
      const speedRange = options.speedRange || [0.1, 1];
      const colorArray = options.colors || ["#fff"];
      stars.push({
        x: (Math.random() * canvas.width) / DPR,
        y: (Math.random() * canvas.height) / DPR,
        size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        speedX:
          (Math.random() - 0.5) * (speedRange[1] - speedRange[0]) +
          Math.sign(Math.random() - 0.5) * speedRange[0],
        speedY:
          (Math.random() - 0.5) * (speedRange[1] - speedRange[0]) +
          Math.sign(Math.random() - 0.5) * speedRange[0],
        color: colorArray[Math.floor(Math.random() * colorArray.length)],
      });
    }
  }

  let rafId;
  const animate = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

    for (const s of stars) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.x += s.speedX;
      s.y += s.speedY;

      if (s.x < 0) s.x = canvas.width / DPR;
      if (s.x > canvas.width / DPR) s.x = 0;
      if (s.y < 0) s.y = canvas.height / DPR;
      if (s.y > canvas.height / DPR) s.y = 0;
    }

    rafId = requestAnimationFrame(animate);
  };
  animate();

  const observer = new MutationObserver(() => {
    if (!document.body.contains(canvas)) {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ===============================
// APPLY BACKGROUND
// ===============================
function applyBackground(name, url, size = null, repeat = false) {
  removeStarfield();

  const body = document.body.style;

  if (!url) {
    document.body.removeAttribute("style");
    localStorage.setItem(
      "customBackground",
      JSON.stringify({ name: "None", url: "", repeat: false })
    );
    return;
  }

  body.backgroundImage = `url('${url}')`;

  if (repeat) {
    body.backgroundRepeat = "repeat";
    body.backgroundSize = size || "auto";
    body.backgroundPosition = "top left";
    body.backgroundAttachment = "scroll";
  } else {
    body.backgroundRepeat = "no-repeat";
    body.backgroundSize = "cover";
    body.backgroundPosition = "center center";
    body.backgroundAttachment = "fixed";
  }

  localStorage.setItem(
    "customBackground",
    JSON.stringify({ name, url, size, repeat })
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
