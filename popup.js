document.addEventListener("DOMContentLoaded", async () => {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const linksWithParamsDiv = document.getElementById("linksWithParams");
  const resultsDiv = document.getElementById("results");

  // --- Helper to escape HTML safely ---
  function escapeHTML(str) {
    return str
      ? str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
      : "";
  }

  // --- Get current domain ---
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentDomain = tab?.url ? new URL(tab.url).hostname : "";

  // --- TAB SWITCHING ---
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(target).classList.add("active");

      if (target === "home") {
        loadFoundLinks();
        loadHomeSecrets();
      }
      if (target === "params") fetchLinksWithParams();
    });
  });

  // --- Deduplicate helper ---
  function dedupeResults(arr) {
    const seen = new Set();
    return arr.filter(item => {
      const key = `${item.url}|${item.keyword}|${item.lineNum}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // --- Load Found Keyword Links (current site only) ---
  function loadFoundLinks() {
    resultsDiv.innerHTML = "Loading...";
    const domainKey = `keywordsFound_${currentDomain}`;

    chrome.storage.local.get(["foundResults", domainKey], (data) => {
      const foundAll = [...(data.foundResults || []), ...(data[domainKey] || [])];

      const found = foundAll.filter(item => {
        try {
          return new URL(item.url).hostname === currentDomain;
        } catch {
          return false;
        }
      });

      const deduped = dedupeResults(found);

      if (deduped.length === 0) {
        resultsDiv.textContent = "No keyword matches found yet.";
        return;
      }

      resultsDiv.innerHTML = "";
      deduped.forEach(item => {
        const div = document.createElement("div");
        div.className = "keyword-item";
        div.style.marginBottom = "10px";
        div.style.background = "#fff";
        div.style.border = "1px solid #ddd";
        div.style.borderRadius = "8px";
        div.style.padding = "8px";
        div.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        div.innerHTML = `
          <b>${escapeHTML(item.keyword)}</b><br>
          <a href="${escapeHTML(item.url)}" target="_blank">${escapeHTML(item.url)}</a><br>
          <small>Line: ${item.lineNum}</small>
        `;
        resultsDiv.appendChild(div);
      });
    });
  }

  // --- Load Secrets in Home Column (current site only) ---
  function loadHomeSecrets() {
    const secretDiv = document.getElementById("homeSecrets");
    secretDiv.innerHTML = "Loading...";
    const domainKey = `secretsFound_${currentDomain}`;
    chrome.storage.local.get([domainKey], (data) => {
      const allMatches = data[domainKey] || [];
      const matches = allMatches.filter(item => {
        try {
          const url = item.pageUrl || item.fileUrl || "";
          return new URL(url).hostname === currentDomain;
        } catch {
          return false;
        }
      });

      // Deduplicate secrets also
      const deduped = matches.filter(
        (v, i, a) =>
          a.findIndex(
            t =>
              t.name === v.name &&
              t.match === v.match &&
              t.fileUrl === v.fileUrl
          ) === i
      );

      if (deduped.length === 0) {
        secretDiv.textContent = "No secrets found yet.";
        return;
      }

      let html = "";
      for (const item of deduped) {
        const fileName = (() => {
          try {
            const url = item.fileUrl || item.pageUrl || "";
            return url.split("/").filter(Boolean).pop() || "home";
          } catch {
            return "home";
          }
        })();

     let link = item.fileUrl || item.pageUrl || "#";
		try {
		  // If it's a relative path like /main.js or main.js
		  const u = new URL(link, tab.url);
		  link = u.href;
		} catch {
		  // fallback in case something breaks
		  link = tab.url;
		}



        html += `
          <div style="
            margin-bottom:12px;
            background:#fff;
            border:1px solid #ddd;
            border-radius:8px;
            padding:10px 12px;
            box-shadow:0 2px 4px rgba(0,0,0,0.08);
          ">
            <div style="font-weight:bold; font-size:14px; color:#222; margin-bottom:6px;">
              ${escapeHTML(item.name)}
            </div>
            <div style="
              font-family:monospace;
              font-size:13px;
              color:#d32f2f;
              background:#fdf0f0;
              border:1px solid #f1cccc;
              border-radius:6px;
              padding:6px 8px;
              margin-bottom:8px;
              word-break:break-all;
            ">
              ${escapeHTML(item.match)}
            </div>
            <div style="font-size:13px;">
              <a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"
                 style="color:#1a73e8; text-decoration:underline;">
                ${escapeHTML(fileName)}
              </a>
            </div>
          </div>`;
      }

      secretDiv.innerHTML = html;
    });
  }

  // --- Initial Load on Popup Open ---
  loadFoundLinks();
  loadHomeSecrets();

  // --- Refresh Button ---
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh";
  refreshBtn.style.marginBottom = "10px";
  refreshBtn.addEventListener("click", () => {
    loadFoundLinks();
    loadHomeSecrets();
  });
  const homeHeader = document.querySelector("#home h2");
  if (homeHeader) homeHeader.insertAdjacentElement("afterend", refreshBtn);

  // --- Settings + Toggles ---
  const keywordsInput = document.getElementById("keywords");
  const notifyModeSelect = document.getElementById("notifyMode");
  const maxLinksSelect = document.getElementById("maxLinks");
  const saveBtn = document.getElementById("save");
  const status = document.getElementById("status");
  const showKeywordsBtn = document.getElementById("showKeywords");
  const keywordsListDiv = document.getElementById("keywordsList");
  const clearAllBtn = document.getElementById("clearAll");
  const siteToggle = document.getElementById("siteToggle");
  const siteLabel = document.getElementById("siteLabel");

  if (tab.url && tab.url.startsWith("http")) {
    siteLabel.textContent = `Turn ON for: ${currentDomain}`;
  }

  chrome.storage.local.get(["activeSites"], (data) => {
    const activeSites = data.activeSites || {};
    siteToggle.checked = !!activeSites[currentDomain];
  });

  // ✅ Toggle logic (fresh scan trigger)
  siteToggle.addEventListener("change", async () => {
    const { activeSites = {} } = await chrome.storage.local.get("activeSites");

    if (siteToggle.checked) {
      activeSites[currentDomain] = true;
      await chrome.storage.local.set({ activeSites });
      chrome.runtime.sendMessage({ cmd: "resetDomain", domain: currentDomain });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) chrome.tabs.reload(tabs[0].id);
      });
      showStatus(`🔍 Fresh scan started for ${currentDomain}`);
    } else {
      delete activeSites[currentDomain];
      await chrome.storage.local.set({ activeSites });
      chrome.runtime.sendMessage({ cmd: "resetDomain", domain: currentDomain });
      showStatus(`❌ Scanning disabled and data cleared.`);
    }
  });

  function showStatus(msg) {
    status.textContent = msg;
    status.className = "success";
    setTimeout(() => (status.textContent = ""), 4000);
  }

  // --- Settings save/load ---
  chrome.storage.local.get(["keywords", "notifyMode", "maxLinks"], (data) => {
    if (data.notifyMode) notifyModeSelect.value = data.notifyMode;
    if (data.maxLinks) maxLinksSelect.value = data.maxLinks;
  });

  saveBtn.addEventListener("click", () => {
    const newKeywords = keywordsInput.value
      ? keywordsInput.value.split(",").map(k => k.trim()).filter(Boolean)
      : [];
    chrome.storage.local.get(["keywords"], (data) => {
      let keywords = data.keywords || [];
      newKeywords.forEach(k => {
        if (!keywords.includes(k)) keywords.push(k);
      });
      chrome.storage.local.set({
        keywords,
        notifyMode: notifyModeSelect.value,
        maxLinks: maxLinksSelect.value
      }, () => {
        status.textContent = "Settings saved!";
        status.className = "success";
        keywordsInput.value = "";
        setTimeout(() => (status.textContent = ""), 2000);
      });
    });
  });

  // --- Show/Remove Keywords ---
  function displayKeywords() {
    chrome.storage.local.get(["keywords"], (data) => {
      keywordsListDiv.innerHTML = "";
      if (!data.keywords || data.keywords.length === 0) {
        keywordsListDiv.textContent = "No keywords saved.";
        return;
      }

      const list = document.createElement("ul");
      list.style.paddingLeft = "0";
      list.style.listStyle = "none";

      data.keywords.forEach((kw) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "5px";
        li.style.borderBottom = "1px solid #ccc";
        li.style.padding = "2px 0";

        const span = document.createElement("span");
        span.textContent = kw;

        const delBtn = document.createElement("span");
        delBtn.textContent = "X";
        delBtn.style.color = "red";
        delBtn.style.cursor = "pointer";
        delBtn.style.marginLeft = "10px";
        delBtn.style.fontWeight = "bold";
        delBtn.title = "Delete keyword";

        delBtn.addEventListener("click", () => {
          const updatedKeywords = data.keywords.filter(k => k !== kw);
          chrome.storage.local.set({ keywords: updatedKeywords }, displayKeywords);
        });

        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);
      });

      keywordsListDiv.appendChild(list);
    });
  }
  showKeywordsBtn.addEventListener("click", displayKeywords);

  // --- Clear All Found Links (current site only) ---
  clearAllBtn.addEventListener("click", () => {
    chrome.storage.local.get(["foundResults"], (data) => {
      const foundAll = data.foundResults || [];
      const remaining = foundAll.filter(item => {
        try {
          return new URL(item.url).hostname !== currentDomain;
        } catch {
          return true;
        }
      });
      chrome.storage.local.set({ foundResults: remaining }, () => {
        resultsDiv.innerHTML = "";
        status.textContent = "Cleared data for this site!";
        setTimeout(() => (status.textContent = ""), 2000);
      });
    });
  });

  // --- Fetch & Display Links with Params ---
  async function fetchLinksWithParams() {
    linksWithParamsDiv.innerHTML = "Loading...";
    const [{ result: linksWithParams }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const baseDomain = window.location.hostname;
        const result = [];
        document.querySelectorAll("a[href]").forEach(a => {
          try {
            const urlObj = new URL(a.href, window.location.origin);
            if (urlObj.hostname === baseDomain && urlObj.search)
              result.push(urlObj.href);
          } catch {}
        });
        return [...new Set(result)];
      }
    });

    if (!linksWithParams || linksWithParams.length === 0) {
      linksWithParamsDiv.textContent = "No internal links with parameters found.";
      return;
    }

    const list = document.createElement("ul");
    linksWithParams.forEach(link => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
      list.appendChild(li);
    });
    linksWithParamsDiv.innerHTML = "";
    linksWithParamsDiv.appendChild(list);
  }

  // --- Live auto-refresh ---
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.foundResults) loadFoundLinks();
  });
});
