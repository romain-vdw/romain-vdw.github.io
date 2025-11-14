document.addEventListener("DOMContentLoaded", () => {
  const themeContainer = document.querySelector(".theme-grid");
  const bgContainer = document.querySelector(".bg-grid");

  if (!themeContainer || !bgContainer) {
    console.error("Settings containers not found");
    return;
  }

  // Wait until themes AND backgrounds exist (loaded by script.js)
  const waitForData = setInterval(() => {
    if (window.themes && window.backgrounds) {
      clearInterval(waitForData);

      generateThemeButtons();
      generateBackgroundButtons();
      highlightActiveOptions();
    }
  }, 50);

  // ===========================
  // Generate Theme Buttons
  // ===========================
  function generateThemeButtons() {
    Object.entries(window.themes).forEach(([key, theme]) => {
      const btn = document.createElement("button");
      btn.className = "theme-option";
      btn.dataset.theme = key;
      btn.textContent = theme.name;

      // Preview (bg1Color overlay + bgColor)
      btn.style.background = `
        linear-gradient(
          ${theme.bg1Color},
          ${theme.bg1Color}
        ),
        ${theme.bgColor}
      `;

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
      btn.dataset.bg = bg.url || "none";
      btn.textContent = bg.name;

      // Preview
      if (bg.preview.startsWith("#")) {
        btn.style.background = bg.preview;
      } else {
        btn.style.backgroundImage = `url(${bg.preview})`;
        btn.style.backgroundSize = "cover";
        btn.style.backgroundPosition = "center";
      }

      bgContainer.appendChild(btn);

      btn.addEventListener("click", () => {
        applyBackground(bg.url, bg.size, bg.repeat);

        document
          .querySelectorAll(".bg-option")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");
      });
    });
  }

  // ===========================
  // Highlight currently active items
  // ===========================
  function highlightActiveOptions() {
    // ---- THEME ----
    const savedTheme = localStorage.getItem("selectedTheme") || "default";

    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === savedTheme);
    });

    // ---- BACKGROUND ----
    let savedBg = "none";

    const stored = localStorage.getItem("customBackground");
    if (stored) {
      try {
        savedBg = JSON.parse(stored).url || "none";
      } catch {}
    }

    document.querySelectorAll(".bg-option").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.bg === savedBg);
    });
  }
});
