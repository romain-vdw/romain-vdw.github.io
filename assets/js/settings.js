document.addEventListener("DOMContentLoaded", async () => {
  const themeContainer = document.querySelector(".theme-grid");
  const bgContainer = document.querySelector(".bg-grid");

  if (!themeContainer || !bgContainer) {
    console.error("Settings containers not found");
    return;
  }

  // Wait until global themes and backgrounds are loaded
  function waitForData() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.themes && Object.keys(window.themes).length > 0) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
  }

  await waitForData();

  // ---- Generate Buttons ----
  Object.entries(window.themes).forEach(([key, theme]) => {
    const btn = document.createElement("button");
    btn.className = "theme-option";
    btn.dataset.theme = key;
    btn.textContent = theme.name;
    if (theme.preview) btn.style.background = theme.bgColor;
    else btn.style.background = theme.accent;
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

  window.backgrounds.forEach((bg) => {
    const btn = document.createElement("button");
    btn.className = "bg-option";
    btn.textContent = bg.name;

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

  // highlight active ones
  const currentTheme = localStorage.getItem("selectedTheme");
  if (currentTheme)
    document
      .querySelector(`[data-theme='${currentTheme}']`)
      ?.classList.add("active");

  const currentBg = JSON.parse(
    localStorage.getItem("customBackground") || "{}"
  );
  if (currentBg?.url)
    document
      .querySelector(`.bg-option[data-bg='${currentBg.url}']`)
      ?.classList.add("active");
});
