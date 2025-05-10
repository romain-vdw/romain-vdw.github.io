// Live Minecraft status
const statusDiv = document.getElementById("mc-status");
const serverIP = "mc.rom1.be";
const apiURL = `https://api.mcsrvstat.us/3/${serverIP}`;

function updateStatus() {
  fetch(apiURL)
    .then((res) => res.json())
    .then((data) => {
      if (!data.online) {
        statusDiv.innerHTML = `<p>Status: <strong style="color: red;">Offline</strong></p>`;
        return;
      }

      const icon = data.icon
        ? `<img src="${data.icon}" alt="Server Icon" class="server-icon">`
        : "";
      const players = data.players?.list?.length
        ? `<p>Online Players: ${data.players.list.join(", ")}</p>`
        : "";

      statusDiv.innerHTML = `
          ${icon}
          <p>Status: <strong style="color: lime;">Online</strong></p>
          <p>Players: ${data.players.online}/${data.players.max}</p>
          ${data.hostname ? `<p>Hostname: ${data.hostname}</p>` : ""}
          <p>IP: ${data.ip}</p>
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

updateStatus();
setInterval(updateStatus, 30000); // auto-refresh every 30s
