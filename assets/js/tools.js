const toolsContainer = document.getElementById("tools-container");
const toolsCollapsedStateKey = "collapsedToolCategories";

function loadToolsCollapseState() {
  try {
    return JSON.parse(localStorage.getItem(toolsCollapsedStateKey)) || {};
  } catch {
    return {};
  }
}

function saveToolsCollapseState(state) {
  localStorage.setItem(toolsCollapsedStateKey, JSON.stringify(state));
}

let toolsCollapseState = loadToolsCollapseState();
let toolsToggleBtn; // Global reference for toolbar button

// Update toolbar button label based on current state
function updateToolsToolbarButton() {
  const allCollapsed = Object.values(toolsCollapseState).every(Boolean);
  if (toolsToggleBtn) {
    toolsToggleBtn.innerHTML = allCollapsed
      ? `<span class="material-icons-round">unfold_more</span> Expand All`
      : `<span class="material-icons-round">unfold_less</span> Collapse All`;
  }
}

// Create toolbar
function createToolsToolbar() {
  const toolbar = document.createElement("div");
  toolbar.classList.add("links-toolbar");

  toolsToggleBtn = document.createElement("button");
  toolsToggleBtn.classList.add("toggle-collapse-btn");
  toolsToggleBtn.innerHTML = `<span class="material-icons-round">unfold_less</span> Collapse All`;

  toolsToggleBtn.addEventListener("click", () => {
    const allCollapsed = Object.values(toolsCollapseState).every(Boolean);
    const newState = !allCollapsed;

    document.querySelectorAll(".link-group").forEach((group) => {
      const header = group.querySelector(".link-group-header");
      const grid = group.querySelector(".tools-grid");
      const category = header.querySelector("h2").textContent;

      grid.classList.toggle("collapsed", newState);
      header
        .querySelector(".expand-icon")
        .classList.toggle("rotated", newState);
      toolsCollapseState[category] = newState;
    });

    saveToolsCollapseState(toolsCollapseState);
    updateToolsToolbarButton();
  });

  toolbar.appendChild(toolsToggleBtn);
  toolsContainer.before(toolbar);
}

function createPreview(tool) {
  const preview = document.createElement("div");

  if (tool.preview?.type === "iframe") {
    preview.classList.add("tool-preview");

    const designWidth = tool.preview.width || 900;
    const designHeight = tool.preview.height || 700;

    const iframe = document.createElement("iframe");
    iframe.src = tool.url;
    iframe.loading = "lazy";
    iframe.tabIndex = -1;
    iframe.width = designWidth;
    iframe.height = designHeight;

    // Scale the real page down to fit the card once we know the card's width
    const ro = new ResizeObserver(() => {
      const scale = preview.clientWidth / designWidth;
      iframe.style.width = `${designWidth}px`;
      iframe.style.height = `${designHeight}px`;
      iframe.style.transform = `scale(${scale})`;
    });
    ro.observe(preview);

    preview.appendChild(iframe);
    return preview;
  }

  // Fallback: icon-only preview
  preview.classList.add("tool-preview", "icon-only");
  const icon = document.createElement("span");
  icon.classList.add("material-icons-round");
  icon.textContent = tool.icon || "build";
  preview.appendChild(icon);
  return preview;
}

function createToolCard(tool) {
  const card = document.createElement("a");
  card.classList.add("card", "tool-card");
  card.href = tool.url;

  const isExternal = /^https?:\/\//i.test(tool.url);
  if (isExternal) {
    card.target = "_blank";
    card.rel = "noopener noreferrer";
  }

  // Order: name -> preview -> description
  const name = document.createElement("div");
  name.classList.add("tool-name");
  name.innerHTML = `${tool.name}${
    isExternal ? '<span class="material-icons-round">open_in_new</span>' : ""
  }`;
  card.appendChild(name);

  card.appendChild(createPreview(tool));

  if (tool.description) {
    const desc = document.createElement("div");
    desc.classList.add("tool-desc");
    desc.textContent = tool.description;
    card.appendChild(desc);
  }

  return card;
}

function createToolCategoryGroup(category, data) {
  const group = document.createElement("section");
  group.classList.add("link-group");

  const header = document.createElement("div");
  header.classList.add("link-group-header");
  header.innerHTML = `
    <span class="material-icons-round">${data.icon || "build"}</span>
    <h2>${category}</h2>
    <span class="material-icons-round expand-icon">expand_more</span>
  `;
  group.appendChild(header);

  const grid = document.createElement("div");
  grid.classList.add("tools-grid");

  if (data.tools.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("tools-empty");
    empty.textContent = "Nothing here yet.";
    grid.appendChild(empty);
  } else {
    for (const tool of data.tools) grid.appendChild(createToolCard(tool));
  }

  group.appendChild(grid);

  if (toolsCollapseState[category]) {
    grid.classList.add("collapsed");
    header.querySelector(".expand-icon").classList.add("rotated");
  }

  header.addEventListener("click", () => {
    grid.classList.toggle("collapsed");
    header.querySelector(".expand-icon").classList.toggle("rotated");
    toolsCollapseState[category] = grid.classList.contains("collapsed");
    saveToolsCollapseState(toolsCollapseState);
    updateToolsToolbarButton();
  });

  return group;
}

fetch("/assets/data/tools.json")
  .then((res) => res.json())
  .then((data) => {
    toolsContainer.innerHTML = "";
    createToolsToolbar();
    for (const [category, info] of Object.entries(data)) {
      toolsContainer.appendChild(createToolCategoryGroup(category, info));
    }
    updateToolsToolbarButton();
  })
  .catch((err) => {
    console.error("Failed to load tools.json:", err);
    toolsContainer.innerHTML = "<p>Error loading tools.</p>";
  });
