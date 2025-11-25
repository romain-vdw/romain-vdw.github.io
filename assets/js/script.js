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
 */
function removeStarfield() {
  const old = document.getElementById("starfield-canvas");
  if (old) old.remove();
}

/**
 * applyAnimatedStarfield(name, options)
 * - name: background name (saved to localStorage)
 * - options: options object from backgrounds.json
 */
function applyAnimatedStarfield(name, options = null) {
  removeStarfield();

  const canvas = document.createElement("canvas");
  canvas.id = "starfield-canvas";
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.imageRendering = "pixelated";
  document.body.appendChild(canvas);

  // If options not provided, try reading from localStorage fallback
  if (!options) {
    const savedBg = JSON.parse(
      localStorage.getItem("customBackground") || "{}"
    );
    options = savedBg.options || {
      type: "pixel",
      count: 200,
      colors: ["#fff"],
      sizeRange: [2, 4],
      speedRange: [0.1, 1],
    };
    name = name || savedBg.name || "Starfield";
  }

  // start fullscreen engine
  startStarfieldFull(canvas, options);

  // Save the selection
  localStorage.setItem(
    "customBackground",
    JSON.stringify({ name, type: "animated-canvas", options })
  );
}

/**
 * startStarfieldFull(canvas, options)
 * Unified full-screen starfield engine with variants:
 * - options.type = "pixel" | "smooth" | "hyperspeed" | "hyperdrive" | "parallax"
 */
function startStarfieldFull(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  // resize handling
  let w = 0;
  let h = 0;
  function resize() {
    w = Math.floor(window.innerWidth * DPR);
    h = Math.floor(window.innerHeight * DPR);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // helpers
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // star containers
  let starLayers = []; // array of layers; each layer is array of star objects
  let lastTs = performance.now();

  // initialize based on type
  function init() {
    starLayers = [];

    // PARALLAX (multi-layer) - layers provided in options.layers
    if (options.type === "parallax" && Array.isArray(options.layers)) {
      for (const layerOpt of options.layers) {
        const layer = [];
        const count = layerOpt.count || 60;
        for (let i = 0; i < count; i++) {
          const colorArray = layerOpt.colors || ["#fff"];
          layer.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: rand(
              layerOpt.sizeRange?.[0] || 1,
              layerOpt.sizeRange?.[1] || 2
            ),
            vx: (Math.random() - 0.5) * (layerOpt.speedMultiplier || 0.3),
            vy: (Math.random() - 0.5) * (layerOpt.speedMultiplier || 0.3),
            color: colorArray[Math.floor(Math.random() * colorArray.length)],
            redshift: layerOpt.redshift || 0,
          });
        }
        starLayers.push({ type: "layer", items: layer, opt: layerOpt });
      }
      return;
    }

    // Default single-layer starfield (pixel / smooth / hyperspeed)
    const type = options.type || "smooth";

    // hyperspeed: longer, faster streaks (still directional)
    if (type === "hyperspeed") {
      const count = options.count || 200;
      const layer = [];
      const sizeRange = options.sizeRange || [1.5, 3];
      const speedRange = options.speedRange || [2, 6];
      const colors = options.colors || ["#fff"];
      for (let i = 0; i < count; i++) {
        layer.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: rand(sizeRange[0], sizeRange[1]),
          vx: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]) * 6,
          vy: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]) * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      starLayers.push({ type: "layer", items: layer, opt: options });
      return;
    }

    // hyperdrive: forward-travel (3D z-based projection) — improved behavior
    if (type === "hyperdrive") {
      const countH = options.count || 350;
      const maxSpeed = options.maxSpeed || 120; // top speed
      const minLength = options.minLength ?? 1;
      const maxLength =
        options.maxLength ??
        Math.max(window.innerWidth, window.innerHeight) * 0.35;
      const centerBias = clamp(options.centerBias ?? 0.7, 0.2, 1.4); // higher -> less center-clustered
      const starColor = options.starColor || "#ffffff";
      const lineWidth = options.lineWidth ?? 1.0;
      const fadeInSpeed = options.fadeInSpeed ?? 1.0;

      const layer = [];
      for (let i = 0; i < countH; i++) {
        // spawn coordinates relative to center, biased but not ultra-dense in center
        const angle = Math.random() * Math.PI * 2;
        const r =
          Math.pow(Math.random(), 1 / Math.max(0.01, centerBias)) *
          Math.min(window.innerWidth, window.innerHeight) *
          0.18;
        const x0 = Math.cos(angle) * r;
        const y0 = Math.sin(angle) * r;

        layer.push({
          x0,
          y0,
          z: rand(0.2, 1.0), // start fairly far on average (less popping at center)
          speed: rand(maxSpeed * 0.25, maxSpeed),
          maxSpeed,
          progress: Math.random() * 0.45, // start partially progressed to avoid perfect sync
          growRate: rand(0.6, 1.4),
          minLength,
          maxLength,
          color: starColor,
          lineWidth,
          life: 0, // opacity 0 → 1
          fadeInSpeed: fadeInSpeed ?? 0.02,
        });
      }
      starLayers.push({
        type: "hyperdrive",
        items: layer,
        opt: options,
      });
      return;
    }

    // DEFAULT single-layer (pixel/smooth)
    const count = options.count || 250;
    const sizeRange = options.sizeRange || [1, 3];
    const speedRange = options.speedRange || [0.05, 0.5];
    const colors = options.colors || ["#fff"];

    const generic = [];
    for (let i = 0; i < count; i++) {
      generic.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: rand(sizeRange[0], sizeRange[1]),
        vx: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]),
        vy: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    starLayers.push({ type: "layer", items: generic, opt: options });
  }

  init();

  // animation loop (handles different types)
  let rafId;
  function frame(now) {
    const dt = Math.max(0.001, (now - lastTs) / 1000);
    lastTs = now;

    // clear (black background)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

    for (const layerWrapper of starLayers) {
      if (layerWrapper.type === "layer") {
        const items = layerWrapper.items;
        const opt = layerWrapper.opt || {};
        for (const s of items) {
          // simple movement
          s.x += (s.vx || 0) * dt * 60;
          s.y += (s.vy || 0) * dt * 60;

          // wrap
          if (s.x < 0) s.x = window.innerWidth;
          if (s.x > window.innerWidth) s.x = 0;
          if (s.y < 0) s.y = window.innerHeight;
          if (s.y > window.innerHeight) s.y = 0;

          ctx.fillStyle = s.color;
          const size = Math.max(1, s.size || 1);
          ctx.fillRect(s.x, s.y, size, size);
        }
      } else if (layerWrapper.type === "hyperdrive") {
        // hyperdrive: center projection with growth
        const items = layerWrapper.items;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const baseScale = Math.min(window.innerWidth, window.innerHeight) * 0.6;
        const maxSpeed = layerWrapper.opt.maxSpeed;

        for (const s of items) {
          // progress increases; speed scaled relative to maxSpeed so different option values behave predictably
          const speedFactor = s.speed / Math.max(1, maxSpeed);
          s.progress += clamp(
            (s.speed / (maxSpeed * 3.2)) * s.growRate * dt * 1.8,
            0,
            1
          );

          // respawn if done (or off-screen)
          if (s.progress >= 1) {
            const angle = Math.random() * Math.PI * 2;
            const r =
              Math.pow(
                Math.random(),
                1 / Math.max(0.01, layerWrapper.opt?.centerBias ?? 0.7)
              ) *
              Math.min(window.innerWidth, window.innerHeight) *
              0.18;
            s.x0 = Math.cos(angle) * r;
            s.y0 = Math.sin(angle) * r;
            s.z = rand(0.2, 1.0);
            s.progress = 0;
            s.speed = rand(
              (layerWrapper.opt?.maxSpeed || maxSpeed) * 0.25,
              layerWrapper.opt?.maxSpeed || maxSpeed
            );
            s.life = 0;
            continue;
          }

          // perspective projection
          const effZ = Math.max(0.02, s.z * (1 - 0.92 * s.progress)); // nearer as progress grows
          const projFactor = baseScale / (effZ * baseScale + 1);

          const sx = cx + s.x0 * projFactor;
          const sy = cy + s.y0 * projFactor;

          // radial unit vector from center
          const dx = sx - cx;
          const dy = sy - cy;
          const radialLen = Math.hypot(dx, dy) || 1;
          const ux = dx / radialLen;
          const uy = dy / radialLen;

          // length calculation tuned: proportional to speed and progress, inversely to z, clamped to min/max
          const growth = s.progress; // 0..1
          // baseLenFactor controls overall length scale; tuned to not explode
          const baseLenFactor = 0.03 + 0.12 * growth;
          let len = (s.speed * baseLenFactor) / (effZ + 0.02);
          len = clamp(
            len,
            s.minLength || 1,
            s.maxLength ||
              Math.max(window.innerWidth, window.innerHeight) * 0.35
          );

          // short tail behind the head
          const back = -Math.max(1, len * 0.06);
          const x1 = sx + ux * back;
          const y1 = sy + uy * back;
          const x2 = sx + ux * len;
          const y2 = sy + uy * len;

          // Increase life if fade enabled
          if (options.fadeIn !== false) {
            s.life = Math.min(1, s.life + s.fadeInSpeed * dt * 60);
          } else {
            s.life = 1;
          }

          // Apply fade-in opacity
          const alpha = s.life;
          ctx.globalAlpha = alpha;

          // Draw the streak
          ctx.strokeStyle = s.color;
          ctx.lineWidth = Math.max(0.4, s.lineWidth || 0.9);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Draw the star head
          ctx.fillStyle = s.color;
          ctx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);

          // Reset global alpha
          ctx.globalAlpha = 1;
        }
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  // cleanup on removal
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
