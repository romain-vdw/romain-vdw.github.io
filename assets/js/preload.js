// ===============================
// PRELOAD THEMES & BACKGROUNDS
// ===============================
(async () => {
  try {
    const [themesRes, bgRes] = await Promise.all([
      fetch("/assets/data/themes.json"),
      fetch("/assets/data/backgrounds.json"),
    ]);

    window.themes = await themesRes.json();
    window.backgrounds = await bgRes.json();

    // APPLY SAVED THEME
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    const theme = window.themes?.[savedTheme];
    if (theme) {
      const root = document.documentElement.style;
      root.setProperty("--accent", theme.accent);
      root.setProperty("--bg-color", theme.bgColor);
      root.setProperty("--bg1-color", theme.bg1Color);
      root.setProperty("--text-color", theme.textColor);
      root.setProperty("--inverse-text-color", theme.inverseTextColor);
    }

    // APPLY SAVED BACKGROUND
    const savedBg = JSON.parse(
      localStorage.getItem("customBackground") || "{}"
    );

    const applyStarfieldIfNeeded = () => {
      if (savedBg.type === "animated-canvas") {
        let attempts = 0;
        const tryStarfield = () => {
          if (typeof applyAnimatedStarfield === "function") {
            document.body.removeAttribute("style");
            applyAnimatedStarfield(savedBg.name, savedBg.options);
          } else if (attempts < 30) {
            attempts++;
            setTimeout(tryStarfield, 100);
          }
        };
        tryStarfield();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyStarfieldIfNeeded);
    } else {
      applyStarfieldIfNeeded();
    }

    // Apply static image background
    if (!savedBg.type && savedBg.url) {
      const body = document.body.style;
      body.backgroundImage = `url('${savedBg.url}')`;
      if (savedBg.repeat) {
        body.backgroundRepeat = "repeat";
        body.backgroundSize = savedBg.size || "auto";
        body.backgroundPosition = "top left";
        body.backgroundAttachment = "scroll";
      } else {
        body.backgroundRepeat = "no-repeat";
        body.backgroundSize = "cover";
        body.backgroundPosition = "center center";
        body.backgroundAttachment = "fixed";
      }
    }

    document.dispatchEvent(new Event("settingsDataReady"));
  } catch (err) {
    console.error("Preload error:", err);
    document.dispatchEvent(new Event("settingsDataReady"));
  }
})();
