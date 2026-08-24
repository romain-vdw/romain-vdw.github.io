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

function extractPlayers(arr) {
  // Normalizes mixed string/object player entries into {name, uuid}
  return arr
    .map((p) => {
      if (typeof p === "string") return { name: p.trim(), uuid: null };
      return { name: (p?.name || "").trim(), uuid: p?.uuid || null };
    })
    .filter((p) => p.name);
}

// Keep timestamps globally so we can live-update them
const serverTimestamps = {}; // { ip: { cacheTime, cacheExpire } }

// ========== CREATE SERVER CARD ==========
function createServerCard(server) {
  const card = document.createElement("div");
  card.classList.add("card", "mc-server-card");
  card.id = `server-${server.ip.replace(/\W/g, "_")}`;

  card.innerHTML = `
    <div class="status-content">
      <div class="status-bar">
        <div class="status-left">
          <span class="status-dot"></span>
          <span class="status-text">Loading...</span>
        </div>
        <div class="server-name">${server.name}</div>
        <div class="server-address" role="button" title="Click to copy">
          <span class="material-icons-round address-copy-icon">content_copy</span>
          <span class="address-text"></span>
        </div>
      </div>

      <div class="server-main">
        <div class="server-icon-col">
          <div class="server-icon-wrap">
            <img class="server-icon" src="/assets/img/packpng.svg" alt="Server icon">
          </div>
          <div class="version-line"></div>
        </div>

        <div class="server-details">
          <div class="motd-wrap"></div>
        </div>
      </div>

      <div class="players-row">
        <span class="players-label">Players</span>
        <div class="players-bar-track"><div class="players-bar-fill"></div></div>
        <span class="players-count">
          <span class="players-current">--</span>/<span class="players-max">--</span>
        </span>
      </div>

      <div class="player-sample-wrap"></div>
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
  const statusText = card.querySelector(".status-text");
  const addrEl = card.querySelector(".server-address");
  const addrTextEl = card.querySelector(".address-text");
  const motdWrap = card.querySelector(".motd-wrap");
  const versionLine = card.querySelector(".version-line");
  const playersCurrent = card.querySelector(".players-current");
  const playersMaxEl = card.querySelector(".players-max");
  const playersBarFill = card.querySelector(".players-bar-fill");
  const sampleWrap = card.querySelector(".player-sample-wrap");
  const lastEl = card.querySelector(".last-updated");
  const nextEl = card.querySelector(".next-update");

  try {
    const res = await fetch(apiURL);
    const data = await res.json();

    const online = data.online === true;
    const icon = data.icon || "/assets/img/packpng.svg";
    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? 0;
    const players = extractPlayers(data.players?.list || []);
    // Real newlines (not literal "\n" text) so pre-wrap can render line breaks.
    // Also normalize typographic dashes to a plain hyphen — the Minecraft
    // webfont doesn't have proper glyphs for en/em dashes, so those chars
    // were falling back to a different font mid-line.
    const motdHTML = data.motd?.html
      ? data.motd.html.join("\n").replace(/[\u2010-\u2015]/g, "-")
      : "";

    const host = data.hostname || server.ip;
    const addrFull = data.debug?.srv
      ? host
      : data.port === 25565
        ? host
        : `${host}:${data.port}`;

    const cacheTime = Number(
      data.debug?.cachetime ?? Math.floor(Date.now() / 1000),
    );
    const cacheExpire = Number(data.debug?.cacheexpire ?? cacheTime + 300);

    // Store timestamps globally for live-updating
    serverTimestamps[server.ip] = { cacheTime, cacheExpire };

    // ICON (falls back to default packpng.svg when the server has none)
    iconWrap.innerHTML = `<img class="server-icon" src="${icon}" alt="Server icon">`;

    // ADDRESS (click-to-copy, underline only on hover via CSS)
    addrTextEl.textContent = addrFull;
    addrEl.onclick = () => {
      navigator.clipboard.writeText(addrFull).then(() => {
        showToastNear(addrEl, "Copied!");
      });
    };

    // VERSION
    versionLine.textContent = data.version || "";
    versionLine.style.display = data.version ? "block" : "none";

    // STATE (vivid green/orange/red)
    let sleeping = online && playersOnline === 0 && playersMax === 20;

    card.classList.remove("state-online", "state-offline", "state-sleeping");

    if (!online) {
      card.classList.add("state-offline");
      statusText.textContent = "Offline";
    } else if (sleeping) {
      card.classList.add("state-sleeping");
      statusText.textContent = "Sleeping";
    } else {
      card.classList.add("state-online");
      statusText.textContent = "Online";
    }

    // PLAYER BAR
    if (!online) {
      playersCurrent.textContent = "--";
      playersMaxEl.textContent = "--";
      playersBarFill.style.width = "0%";
      playersCurrent.style.color = "";
      sampleWrap.innerHTML = "";
    } else {
      const pct = playersMax > 0 ? playersOnline / playersMax : 0;
      let color = "lime"; // vivid green
      if (playersOnline >= playersMax && playersMax > 0)
        color = "red"; // vivid red
      else if (pct >= 0.5) color = "orange"; // vivid orange

      playersCurrent.textContent = playersOnline;
      playersMaxEl.textContent = playersMax;
      playersCurrent.style.color = color;
      playersBarFill.style.width = `${Math.min(pct * 100, 100)}%`;
      playersBarFill.style.background = color;

      // PLAYER LIST (only shown when there are players online)
      if (players.length) {
        sampleWrap.innerHTML = `
          <div class="player-sample-label">Player(s)</div>
          <div class="player-sample-list">
            ${players
              .map((p) => {
                const id = encodeURIComponent(p.uuid || p.name);
                const avatar = `https://mc-heads.net/avatar/${id}/20`;
                return `
                  <div class="player-chip">
                    <img class="player-avatar" src="${avatar}" alt="" loading="lazy"
                         onerror="this.src='/assets/img/packpng.svg'">
                    <span>${p.name}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      } else {
        sampleWrap.innerHTML = "";
      }
    }

    // MOTD (pre-wrap preserves leading spaces / real line breaks, like in-game)
    motdWrap.innerHTML = motdHTML;
    motdWrap.style.display = motdHTML ? "block" : "none";

    // FOOTER (initial fill)
    lastEl.textContent = `Last updated: ${relHumanFromSec(cacheTime)}`;
    nextEl.textContent = `Next update: ${nextFormatSec(cacheExpire)}`;
  } catch (err) {
    console.error("Error:", err);
    card.classList.remove("state-online", "state-sleeping");
    card.classList.add("state-offline");
    statusText.textContent = "Error fetching";
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

// ========== LIVE UPDATE "Last updated / Next update" ==========
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

    // Instant refresh when expired
    if (now >= t.cacheExpire) {
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
    window._serversList = servers;

    servers.forEach((server) => {
      const card = createServerCard(server);
      updateServerStatus(server, card);
    });

    // Auto-refresh every 5 min
    setInterval(() => updateAllServers(servers), 300000);
  })
  .catch((err) => console.error("Failed to load servers.json:", err));
