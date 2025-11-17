document.addEventListener("settingsDataReady", () => {
  const themeContainer = document.querySelector(".theme-grid");
  const bgContainer = document.querySelector(".bg-grid");

  if (!themeContainer || !bgContainer) return;

  generateThemeButtons();
  generateBackgroundButtons();
  highlightActiveOptions();

  // ===========================
  // Generate Theme Buttons
  // ===========================
  function generateThemeButtons() {
    Object.entries(window.themes).forEach(([key, theme]) => {
      const btn = document.createElement("button");
      btn.className = "theme-option";
      btn.dataset.theme = key;
      btn.textContent = theme.name;
      btn.style.background = `linear-gradient(${theme.bg1Color}, ${theme.bg1Color}), ${theme.bgColor}`;
      btn.style.color = theme.textColor;
      themeContainer.appendChild(btn);

      btn.addEventListener("click", () => {
        applyTheme(key, true);
        document
          .querySelectorAll(".theme-option")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // ===========================
  // Generate Background Buttons
  // ===========================
  function generateBackgroundButtons() {
    window.backgrounds.forEach((bg) => {
      const btn = document.createElement("button");
      btn.className = "bg-option";
      btn.dataset.name = bg.name;

      const label = document.createElement("span");
      label.className = "bg-label";
      label.textContent = bg.name;
      btn.appendChild(label);

      // Static preview
      if (!bg.type) {
        if (bg.preview?.startsWith("#")) btn.style.background = bg.preview;
        else {
          btn.style.backgroundImage = `url(${bg.preview})`;
          btn.style.backgroundSize = "cover";
          btn.style.backgroundPosition = "center";
        }
      }

      // Animated starfield preview
      if (bg.type === "animated-canvas") {
        const previewCanvas = document.createElement("canvas");
        previewCanvas.className = "starfield-preview";
        btn.appendChild(previewCanvas);
        requestAnimationFrame(() =>
          startStarfieldPreview(previewCanvas, bg.options)
        );
      }

      bgContainer.appendChild(btn);

      btn.addEventListener("click", () => {
        if (bg.type === "animated-canvas")
          applyAnimatedStarfield(bg.name, bg.options);
        else applyBackground(bg.name, bg.url, bg.size, bg.repeat);

        document
          .querySelectorAll(".bg-option")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // ===========================
  // Highlight Active
  // ===========================
  function highlightActiveOptions() {
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === savedTheme);
    });

    let savedBgName = "";
    const stored = localStorage.getItem("customBackground");
    if (stored) {
      try {
        savedBgName = JSON.parse(stored).name || "";
      } catch {}
    }

    document.querySelectorAll(".bg-option").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.name === savedBgName);
    });
  }
});

/**
 * startStarfieldPreview(canvas, options)
 * Creates a small animated starfield inside a button.
 * Uses same options as full-screen starfield.
 */
function startStarfieldPreview(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * DPR));
    canvas.height = Math.max(1, Math.floor(rect.height * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  resizeCanvas();
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(canvas);

  let stars = [];

  const createStars = () => {
    stars = [];

    const buttonArea = (canvas.width / DPR) * (canvas.height / DPR);
    const baseArea = 1920 * 1080; // reference full-screen area
    const scaleFactor = Math.max(0.1, buttonArea / baseArea); // scale count down

    if (options.type === "parallax" && Array.isArray(options.layers)) {
      options.layers.forEach((layer) => {
        const layerCount = Math.floor((layer.count || 40) * scaleFactor);
        for (let i = 0; i < layerCount; i++) {
          const colors = layer.colors || ["#fff"];
          stars.push({
            x: Math.random() * (canvas.width / DPR),
            y: Math.random() * (canvas.height / DPR),
            size:
              layer.sizeRange?.[0] +
              Math.random() *
                ((layer.sizeRange?.[1] || 2) - (layer.sizeRange?.[0] || 1)),
            speedX: (Math.random() - 0.5) * (layer.speedMultiplier || 0.5),
            speedY: (Math.random() - 0.5) * (layer.speedMultiplier || 0.5),
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      });
    } else {
      const count = Math.floor((options.count || 40) * scaleFactor);
      const sizeRange = options.sizeRange || [2, 3];
      const speedRange = options.speedRange || [0.1, 0.5];
      const colors = options.colors || ["#fff"];

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * (canvas.width / DPR),
          y: Math.random() * (canvas.height / DPR),
          size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
          speedX:
            (Math.random() - 0.5) * (speedRange[1] - speedRange[0]) +
            Math.sign(Math.random() - 0.5) * speedRange[0],
          speedY:
            (Math.random() - 0.5) * (speedRange[1] - speedRange[0]) +
            Math.sign(Math.random() - 0.5) * speedRange[0],
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }
  };

  createStars();
  let raf = null;
  const animate = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

    stars.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.x += s.speedX;
      s.y += s.speedY;

      if (s.x < 0) s.x = canvas.width / DPR;
      if (s.x > canvas.width / DPR) s.x = 0;
      if (s.y < 0) s.y = canvas.height / DPR;
      if (s.y > canvas.height / DPR) s.y = 0;
    });

    raf = requestAnimationFrame(animate);
  };
  animate();

  const mo = new MutationObserver(() => {
    if (!document.body.contains(canvas)) {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
