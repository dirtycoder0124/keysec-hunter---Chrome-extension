// secrets.js
// Displays secrets only for the current active site's domain (fresh, domain-specific results)

(async () => {
  try {
    const container = document.getElementById("secretResults");
    if (!container) return;

    container.innerHTML = "Loading saved secrets...";

    // Get current tab and domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      container.textContent = "Unable to detect current site.";
      return;
    }

    const currentDomain = new URL(tab.url).hostname;
    const storageKey = `secretsFound_${currentDomain}`;

    // Fetch secrets for this domain
    chrome.storage.local.get([storageKey], (data) => {
      const matches = data[storageKey] || [];

      container.innerHTML = ""; // Clear "Loading..."
      if (matches.length === 0) {
        container.textContent = "No secrets found yet for this site.";
        return;
      }

      // Render each secret
      for (const item of matches) {
        const div = document.createElement("div");
        div.className = "secret-item";

        const url = item.pageUrl || "";
        const fileUrl = item.fileUrl || "";
        let displayName = "";

        try {
          // Determine readable filename
          if (!fileUrl || fileUrl === "PAGE_HTML") {
            const pageName = url.split("/").filter(Boolean).pop() || "index.html";
            displayName = makeLink(url, pageName);
          } 
          else if (fileUrl.includes("#script-")) {
            const baseName = fileUrl.split("#")[0].split("/").pop() || "index.html";
            const scriptNum = fileUrl.split("#script-").pop();
            displayName = makeLink(url, `${baseName} (inline script ${scriptNum})`);
          } 
          else {
            const cleanName = fileUrl.split("/").pop() || "index.html";
            displayName = makeLink(fileUrl, cleanName);
          }
        } catch {
          displayName = `<span>index.html</span>`;
        }

        div.innerHTML = `
          <div style="font-weight:600; color:#222; margin-bottom:4px;">
            ${escapeHtml(item.name)}
          </div>
          <div style="white-space:pre-wrap; font-family:monospace; background:#fafafa;
                      border-radius:5px; padding:6px 8px; margin-bottom:6px;
                      font-size:13px; border:1px solid #eee;">
            ${highlightSecret(item.match)}
          </div>
          <div style="font-size:12px; color:#555;">${displayName}</div>
        `;
        container.appendChild(div);
      }
    });

  } catch (err) {
    console.error("Secrets tab error:", err);
    const container = document.getElementById("secretResults");
    if (container) container.textContent = "Error loading secrets: " + String(err);
  }
})();

// ---------- Helpers ----------
function escapeHtml(s) {
  return s
    ? String(s).replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
      )
    : "";
}

function highlightSecret(secret) {
  return secret
    ? `<span style="color:#c62828; font-weight:bold;">${escapeHtml(secret)}</span>`
    : "";
}

function makeLink(href, text) {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
            style="color:#1a73e8; text-decoration:underline;">
            ${escapeHtml(text)}
          </a>`;
}
