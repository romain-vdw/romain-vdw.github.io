// Live Minecraft status
const container = document.getElementById("mc-servers");

function createServerCard(server) {
  const card = document.createElement("div");
  card.classList.add("card", "mc-server-card");
  card.id = `server-${server.ip.replace(/\W/g, "_")}`;
  card.innerHTML = `
    <h2>${server.name}</h2>
    <div class="status-content">
      <p>Status: <em>Loading...</em></p>
    </div>
  `;
  container.appendChild(card);
  return card;
}

async function updateServerStatus(server, card) {
  const apiURL = `https://api.mcsrvstat.us/3/${server.ip}`;
  const content = card.querySelector(".status-content");

  fetch(apiURL)
    .then((res) => res.json())
    .then((data) => {
      if (!data.online) {
        content.innerHTML = `<p><strong style="color: red;">Offline</strong></p>`;
        return;
      }

      const icon = data.icon
        ? `<img src="${data.icon}" alt="Server Icon" class="server-icon">`
        : `<span class="material-icons-round server-icon placeholder">cloud_off</span>`;
      const players = data.players?.list?.length
        ? `<p>Online Players: ${data.players.list.join(", ")}</p>`
        : "";

      content.innerHTML = `
          <div class="server-header">
            ${icon}
            <p><strong style="color: lime;">Online</strong></p>
          </div>
          <p>Players: ${data.players.online}/${data.players.max}</p>
          ${data.hostname ? `<p>Address: ${data.hostname}</p>` : ""}
          <p>Version: ${data.version}</p>
          ${
            data.motd
              ? `<div class="motd">MOTD: ${data.motd?.html.join(" \\n ")}</div>`
              : ""
          }
          ${players}
        `;
    })
    .catch((err) => {
      console.error(err);
      statusDiv.innerHTML = "<p>Error fetching server status.</p>";
    });
}

function updateAllServers(servers) {
  for (const server of servers) {
    const card = document.getElementById(
      `server-${server.ip.replace(/\W/g, "_")}`
    );
    updateServerStatus(server, card);
  }
}

// Load servers from JSON
fetch("/assets/data/mc-servers.json")
  .then((res) => res.json())
  .then((servers) => {
    // Create cards for each server
    for (const server of servers) {
      createServerCard(server);
      updateServerStatus(
        server,
        document.getElementById(`server-${server.ip.replace(/\W/g, "_")}`)
      );
    }
    // Auto-refresh every 30s
    setInterval(() => updateAllServers(servers), 30000);
  })
  .catch((err) => {
    console.error("Failed to load servers.json:", err);
  });
