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
 * Lightweight preview engine used in settings buttons.
 * Scales down counts and uses same options types as full-screen.
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

  // helpers: random in range
  const rand = (a, b) => a + Math.random() * (b - a);

  let stars = [];

  const createStars = () => {
    stars = [];
    const buttonArea = (canvas.width / DPR) * (canvas.height / DPR);
    const baseArea = 1920 * 1080;
    const scaleFactor = Math.max(0.05, Math.min(1, buttonArea / baseArea));

    const type = options.type || "smooth";

    if (type === "parallax" && Array.isArray(options.layers)) {
      for (const layer of options.layers) {
        const cnt = Math.max(2, Math.floor((layer.count || 40) * scaleFactor));
        for (let i = 0; i < cnt; i++) {
          stars.push({
            x: Math.random() * (canvas.width / DPR),
            y: Math.random() * (canvas.height / DPR),
            size: rand(layer.sizeRange?.[0] || 1, layer.sizeRange?.[1] || 2),
            vx: (Math.random() - 0.5) * (layer.speedMultiplier || 0.3),
            vy: (Math.random() - 0.5) * (layer.speedMultiplier || 0.3),
            color: (layer.colors || ["#fff"])[
              Math.floor(Math.random() * (layer.colors || ["#fff"]).length)
            ],
          });
        }
      }
      return;
    }

    if (type === "hyperdrive") {
      const fadeInSpeed = options.fadeInSpeed ?? 0.02;
      const fadeInEnabled = options.fadeIn !== false;

      const cnt = Math.max(
        6,
        Math.floor((options.count || 200) * scaleFactor * 1)
      );

      for (let i = 0; i < cnt; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r =
          Math.pow(
            Math.random(),
            1 / Math.max(0.01, options.centerBias ?? 0.7)
          ) *
          Math.min(canvas.width / DPR, canvas.height / DPR) *
          0.1;

        stars.push({
          x0: Math.cos(angle) * r,
          y0: Math.sin(angle) * r,
          z: rand(0.2, 1),
          speed: rand(
            (options.maxSpeed || 120) * 0.25,
            options.maxSpeed || 120
          ),
          progress: Math.random() * 0.45,
          growRate: rand(0.6, 1.4),
          minLength: options.minLength ?? 1,
          maxLength:
            options.maxLength ??
            Math.max(canvas.width / DPR, canvas.height / DPR) * 0.28,
          color: options.starColor || "#fff",
          lineWidth: options.lineWidth ?? 1.0,

          // fade-in
          life: 0,
          fadeInSpeed: fadeInSpeed,
        });
      }

      let raf = null;
      const animatePreview = () => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

        const cx = canvas.width / DPR / 2;
        const cy = canvas.height / DPR / 2;
        const baseScale =
          Math.min(canvas.width / DPR, canvas.height / DPR) * 0.6;

        for (const s of stars) {
          // progress update
          s.progress +=
            (s.speed / (options.maxSpeed || 120) / 3.2) *
            s.growRate *
            0.9 *
            (1 / 60);

          // respawn
          if (s.progress >= 1) {
            const angle = Math.random() * Math.PI * 2;
            const r =
              Math.pow(
                Math.random(),
                1 / Math.max(0.01, options.centerBias ?? 0.7)
              ) *
              Math.min(canvas.width / DPR, canvas.height / DPR) *
              0.1;

            s.x0 = Math.cos(angle) * r;
            s.y0 = Math.sin(angle) * r;
            s.z = rand(0.2, 1);
            s.progress = 0;
            s.speed = rand(
              (options.maxSpeed || 120) * 0.25,
              options.maxSpeed || 120
            );

            s.life = 0;
            continue;
          }

          // fade-in
          if (fadeInEnabled) {
            s.life = Math.min(1, s.life + s.fadeInSpeed);
          } else {
            s.life = 1;
          }
          ctx.globalAlpha = s.life;

          // perspective
          const effZ = Math.max(0.02, s.z * (1 - 0.92 * s.progress));
          const projFactor = baseScale / (effZ * baseScale + 1);
          const sx = cx + s.x0 * projFactor;
          const sy = cy + s.y0 * projFactor;

          // radial direction
          const dx = sx - cx;
          const dy = sy - cy;
          const radialLen = Math.hypot(dx, dy) || 1;
          const ux = dx / radialLen;
          const uy = dy / radialLen;

          // full hyperdrive length math (scaled for preview)
          const growth = s.progress;
          const baseLenFactor = 0.03 + 0.12 * growth;

          let len = (s.speed * baseLenFactor) / (effZ + 0.02);
          len = Math.max(s.minLength, Math.min(s.maxLength, len));

          // back and forward points
          const back = -Math.max(1, len * 0.06);
          const x1 = sx + ux * back;
          const y1 = sy + uy * back;
          const x2 = sx + ux * len;
          const y2 = sy + uy * len;

          // streak
          ctx.strokeStyle = s.color;
          ctx.lineWidth = Math.max(0.4, s.lineWidth || 0.9);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // head
          ctx.fillStyle = s.color;
          ctx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);

          ctx.globalAlpha = 1;
        }

        raf = requestAnimationFrame(animatePreview);
      };

      raf = requestAnimationFrame(animatePreview);

      const mo = new MutationObserver(() => {
        if (!document.body.contains(canvas)) {
          cancelAnimationFrame(raf);
          ro.disconnect();
          mo.disconnect();
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      return;
    }

    // fallback generic small starfield
    const count = Math.max(6, Math.floor((options.count || 40) * scaleFactor));
    const sizeRange = options.sizeRange || [1, 2];
    const speedRange = options.speedRange || [0.05, 0.3];
    const colors = options.colors || ["#fff"];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * (canvas.width / DPR),
        y: Math.random() * (canvas.height / DPR),
        size: rand(sizeRange[0], sizeRange[1]),
        vx: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]),
        vy: (Math.random() - 0.5) * rand(speedRange[0], speedRange[1]),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  createStars();

  // IMPORTANT FIX: if custom renderer, STOP here
  if (options.type === "hyperdrive") {
    return; // prevents fallback animate() from overwriting canvas
  }

  let raf = null;
  const animate = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

    for (const s of stars) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, Math.max(1, s.size), Math.max(1, s.size));
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = canvas.width / DPR;
      if (s.x > canvas.width / DPR) s.x = 0;
      if (s.y < 0) s.y = canvas.height / DPR;
      if (s.y > canvas.height / DPR) s.y = 0;
    }

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
