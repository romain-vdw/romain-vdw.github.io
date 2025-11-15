// PRELOAD FETCH BEFORE CSS
(async () => {
  try {
    // Fetch themes + backgrounds BEFORE page renders fully
    const [themesRes, bgRes] = await Promise.all([
      fetch("/assets/data/themes.json"),
      fetch("/assets/data/backgrounds.json"),
    ]);

    window.themes = await themesRes.json();
    window.backgrounds = await bgRes.json();

    // Apply saved theme immediately (no blinking)
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

    // Apply saved background immediately too
    const savedBg = JSON.parse(
      localStorage.getItem("customBackground") || "{}"
    );
    if (savedBg.url) {
      const body = document.body.style;
      body.backgroundImage = `url(${savedBg.url})`;
      body.backgroundSize = savedBg.size || "cover";
      body.backgroundRepeat = savedBg.repeat || "no-repeat";
    }

    // Notify all other scripts
    document.dispatchEvent(new Event("settingsDataReady"));
  } catch (err) {
    console.error("Preload error:", err);
  }
})();
