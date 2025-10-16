const container = document.getElementById("links-container");
const collapsedStateKey = "collapsedCategories";

// Load saved collapse state
function loadCollapseState() {
  try {
    return JSON.parse(localStorage.getItem(collapsedStateKey)) || {};
  } catch {
    return {};
  }
}

// Save collapse state
function saveCollapseState(state) {
  localStorage.setItem(collapsedStateKey, JSON.stringify(state));
}

let collapseState = loadCollapseState();
let toggleBtn; // Global reference for toolbar button

// Update toolbar button label based on current state
function updateToolbarButton() {
  const allCollapsed = Object.values(collapseState).every(Boolean);
  if (toggleBtn) {
    toggleBtn.innerHTML = allCollapsed
      ? `<span class="material-icons-round">unfold_more</span> Expand All`
      : `<span class="material-icons-round">unfold_less</span> Collapse All`;
  }
}

// Create toolbar
function createToolbar() {
  const toolbar = document.createElement("div");
  toolbar.classList.add("links-toolbar");

  toggleBtn = document.createElement("button");
  toggleBtn.classList.add("toggle-collapse-btn");
  toggleBtn.innerHTML = `<span class="material-icons-round">unfold_less</span> Collapse All`;

  toggleBtn.addEventListener("click", () => {
    const allCollapsed = Object.values(collapseState).every(Boolean);
    const newState = !allCollapsed;

    document.querySelectorAll(".link-group").forEach((group) => {
      const header = group.querySelector(".link-group-header");
      const grid = group.querySelector(".links-grid");
      const category = header.querySelector("h2").textContent;

      grid.classList.toggle("collapsed", newState);
      header
        .querySelector(".expand-icon")
        .classList.toggle("rotated", newState);
      collapseState[category] = newState;
    });

    saveCollapseState(collapseState);
    updateToolbarButton();
  });

  toolbar.appendChild(toggleBtn);
  container.before(toolbar);
}

function createLinkCard(link) {
  const card = document.createElement("a");
  card.classList.add("card", "link-card");
  card.href = link.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.textContent = link.name;
  return card;
}

function createLinkCard(link) {
  const card = document.createElement("a");
  card.classList.add("card", "link-card");
  card.href = link.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.textContent = link.name;
  return card;
}

function createCategoryGroup(category, data) {
  const group = document.createElement("section");
  group.classList.add("link-group");

  // Header with icon
  const header = document.createElement("div");
  header.classList.add("link-group-header");
  header.innerHTML = `
    <span class="material-icons-round">${data.icon || "folder"}</span>
    <h2>${category}</h2>
    <span class="material-icons-round expand-icon">expand_more</span>
  `;
  group.appendChild(header);

  // Grid container
  const grid = document.createElement("div");
  grid.classList.add("links-grid");
  for (const link of data.links) grid.appendChild(createLinkCard(link));
  group.appendChild(grid);

  // Restore collapse state
  if (collapseState[category]) {
    grid.classList.add("collapsed");
    header.querySelector(".expand-icon").classList.add("rotated");
  }

  // Toggle category collapse
  header.addEventListener("click", () => {
    grid.classList.toggle("collapsed");
    header.querySelector(".expand-icon").classList.toggle("rotated");

    collapseState[category] = grid.classList.contains("collapsed");
    saveCollapseState(collapseState);
    updateToolbarButton();
  });

  return group;
}

fetch("/assets/data/links.json")
  .then((res) => res.json())
  .then((data) => {
    container.innerHTML = "";
    createToolbar();
    for (const [category, info] of Object.entries(data)) {
      container.appendChild(createCategoryGroup(category, info));
    }
    updateToolbarButton();
  })
  .catch((err) => {
    console.error("Failed to load links.json:", err);
    container.innerHTML = "<p>Error loading links.</p>";
  });
