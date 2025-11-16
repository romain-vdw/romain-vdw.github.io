// ===============================
// Minecraft Status Dashboard
// ===============================

const container = document.getElementById("mc-servers");

// ========== TOAST NEXT TO ELEMENT ==========
function showToastNear(el, msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;

  const rect = el.getBoundingClientRect();
  t.style.left = rect.right + 10 + "px";
  t.style.top = rect.top + "px";

  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1500);
}

// ========== TIME HELPERS ==========
function nextFormatSec(expireTs) {
  const now = Math.floor(Date.now() / 1000);
  let s = expireTs - now;
  if (s < 0) s = 0;

  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function relHumanFromSec(ts) {
  const now = Math.floor(Date.now() / 1000);
  let diff = now - ts;
  if (diff < 0) diff = 0;

  return diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ago`;
}

function extractPlayerNames(arr) {
  return arr
    .map((p) => (typeof p === "string" ? p : p?.name).trim())
    .filter(Boolean);
}

// Keep timestamps globally so we can live-update them
const serverTimestamps = {}; // { ip: { cacheTime, cacheExpire } }

// ========== CREATE SERVER CARD ==========
function createServerCard(server) {
  const card = document.createElement("div");
  card.classList.add("card", "mc-server-card");
  card.id = `server-${server.ip.replace(/\W/g, "_")}`;

  card.innerHTML = `
    <h2 class="mc-server-title">${server.name}</h2>

    <div class="status-content">
      <div class="server-header">
        <div class="server-icon-wrap">
          <img class="server-icon" src="/assets/img/packpng.svg" alt="Server icon">
        </div>
        <div class="server-state-wrap">
          <p class="state-line"><em>Loading...</em></p>
        </div>
      </div>

      <div class="server-body">
        <div class="players-wrap"></div>

        <p class="address-line">Address:
          <span class="address-value" role="button"></span>
        </p>

        <p class="version-line"></p>

        <p class="motd-wrap"></p>

        <div class="player-list-wrap"></div>
      </div>
    </div>

    <div class="server-footer">
      <div class="footer-right small-muted">
        <span class="last-updated">Last updated: --</span>
        <span class="sep"> | </span>
        <span class="next-update">Next update: --</span>
      </div>
    </div>
  `;

  container.appendChild(card);
  return card;
}

// ========== UPDATE SERVER CARD ==========
async function updateServerStatus(server, card) {
  const apiURL = `https://api.mcsrvstat.us/3/${server.ip}`;

  const iconWrap = card.querySelector(".server-icon-wrap");
  const stateLine = card.querySelector(".state-line");
  const playersWrap = card.querySelector(".players-wrap");
  const listWrap = card.querySelector(".player-list-wrap");
  const addrValue = card.querySelector(".address-value");
  const versionLine = card.querySelector(".version-line");
  const motdWrap = card.querySelector(".motd-wrap");
  const lastEl = card.querySelector(".last-updated");
  const nextEl = card.querySelector(".next-update");

  try {
    const res = await fetch(apiURL);
    const data = await res.json();

    const online = data.online === true;
    const icon = data.icon || "/assets/img/packpng.svg";
    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? 0;
    const names = extractPlayerNames(data.players?.list || []);
    const motdHTML = data.motd?.html ? data.motd.html.join(" \\n ") : "";

    const host = data.hostname || server.ip;
    const addrFull = data.port === 25565 ? host : `${host}:${data.port}`;

    const cacheTime = Number(
      data.debug?.cachetime ?? Math.floor(Date.now() / 1000)
    );
    const cacheExpire = Number(data.debug?.cacheexpire ?? cacheTime + 300);

    // Store timestamps globally for live-updating
    serverTimestamps[server.ip] = { cacheTime, cacheExpire };

    // ICON
    iconWrap.innerHTML = `<img class="server-icon" src="${icon}" alt="Server icon">`;

    // ADDRESS (Click-to-copy)
    addrValue.textContent = addrFull;
    addrValue.onclick = () => {
      navigator.clipboard.writeText(addrFull).then(() => {
        showToastNear(addrValue, "Copied!");
      });
    };

    // VERSION
    versionLine.textContent = data.version ? `Version: ${data.version}` : "";

    // STATE
    let sleeping = online && playersOnline === 0 && playersMax === 20;

    if (!online) {
      stateLine.innerHTML = `<strong style="color: red;">Offline</strong>`;
    } else if (sleeping) {
      stateLine.innerHTML = `<strong style="color: orange;">Sleeping</strong>`;
    } else {
      stateLine.innerHTML = `<strong style="color: lime;">Online</strong>`;
    }

    // PLAYERS SUMMARY
    if (!online || sleeping) {
      playersWrap.innerHTML = "";
      listWrap.innerHTML = "";
    } else {
      const pct = playersMax > 0 ? playersOnline / playersMax : 0;
      let color = "lime";
      if (playersOnline >= playersMax) color = "red";
      else if (pct >= 0.5) color = "yellow";

      playersWrap.innerHTML = `<p class="players-summary" style="color:${color}">Players: ${playersOnline}/${playersMax}</p>`;
      listWrap.innerHTML = names.length
        ? `<p class="player-list">Online: ${names.join(", ")}</p>`
        : "";
    }

    // MOTD (single line)
    motdWrap.innerHTML = motdHTML ? "MOTD: " + motdHTML : "";

    // FOOTER (initial fill)
    lastEl.textContent = `Last updated: ${relHumanFromSec(cacheTime)}`;
    nextEl.textContent = `Next update: ${nextFormatSec(cacheExpire)}`;
  } catch (err) {
    console.error("Error:", err);
    stateLine.innerHTML = `<strong style="color: red;">Error fetching</strong>`;
  }
}

// ========== AUTO REFRESH ==========
function updateAllServers(servers) {
  servers.forEach((server) => {
    const id = `server-${server.ip.replace(/\W/g, "_")}`;
    const card = document.getElementById(id);
    if (card) updateServerStatus(server, card);
  });
}

// ========== LIVE UPDATE “Last updated / Next update” ==========
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);

  for (const [ip, t] of Object.entries(serverTimestamps)) {
    const card = document.getElementById(`server-${ip.replace(/\W/g, "_")}`);
    if (!card) continue;

    const lastEl = card.querySelector(".last-updated");
    const nextEl = card.querySelector(".next-update");

    // Update display
    lastEl.textContent = `Last updated: ${relHumanFromSec(t.cacheTime)}`;
    nextEl.textContent = `Next update: ${nextFormatSec(t.cacheExpire)}`;

    // ---- NEW: instant refresh when expired ----
    if (now >= t.cacheExpire) {
      // Refresh THIS server immediately
      const ipRaw = ip;
      const serversJson = window._serversList || [];
      const serverData = serversJson.find((s) => s.ip === ipRaw);

      if (serverData) {
        updateServerStatus(serverData, card);
      }
    }
  }
}, 1000);

// ========== INIT ==========
fetch("/assets/data/mc-servers.json")
  .then((res) => res.json())
  .then((servers) => {
    window._serversList = servers; // <--- added

    servers.forEach((server) => {
      const card = createServerCard(server);
      updateServerStatus(server, card);
    });

    // Auto-refresh every 5 min
    setInterval(() => updateAllServers(servers), 300000);
  })
  .catch((err) => console.error("Failed to load servers.json:", err));
