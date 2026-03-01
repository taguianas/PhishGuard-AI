const BACKEND = 'http://localhost:4000';

const urlDisplay = document.getElementById('url-display');
const scanBtn    = document.getElementById('scan-btn');
const resultDiv  = document.getElementById('result');
const errorDiv   = document.getElementById('error');
const badgeEl    = document.getElementById('badge');
const scoreEl    = document.getElementById('score');
const reasonsEl  = document.getElementById('reasons');

let currentUrl = '';

// Load the active tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab?.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    currentUrl = tab.url;
    urlDisplay.textContent = currentUrl;
  } else {
    urlDisplay.textContent = 'Not a scannable page';
    scanBtn.disabled = true;
  }
});

scanBtn.addEventListener('click', async () => {
  if (!currentUrl) return;

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning…';
  resultDiv.style.display = 'none';
  errorDiv.style.display  = 'none';

  try {
    const res = await fetch(`${BACKEND}/api/url/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl }),
    });

    if (!res.ok) throw new Error('Scan failed');
    const data = await res.json();
    renderResult(data);

    // Cache result
    chrome.storage.local.set({ [currentUrl]: { result: data, ts: Date.now() } });
  } catch (err) {
    errorDiv.textContent = 'Could not reach PhishGuard backend. Is it running on port 4000?';
    errorDiv.style.display = 'block';
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan This URL';
  }
});

function renderResult(data) {
  const { risk_score, classification, reasons } = data;

  // Badge
  const cls = classification === 'High Risk'   ? 'badge-high'   :
              classification === 'Medium Risk' ? 'badge-medium' : 'badge-low';
  const dotColor = classification === 'High Risk'   ? '#ef4444' :
                   classification === 'Medium Risk' ? '#f59e0b' : '#22c55e';

  badgeEl.className = `badge ${cls}`;
  badgeEl.innerHTML = `<span class="badge-dot" style="background:${dotColor}"></span>${classification}`;

  // Score
  const scoreColor = classification === 'High Risk'   ? '#dc2626' :
                     classification === 'Medium Risk' ? '#d97706' : '#16a34a';
  scoreEl.textContent = risk_score;
  scoreEl.style.color = scoreColor;

  // Reasons
  reasonsEl.innerHTML = reasons.length === 0
    ? '<p style="font-size:12px;color:#64748b">No suspicious signals detected.</p>'
    : reasons.slice(0, 4).map(r => `
        <div class="reason-item">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          ${escapeHtml(r)}
        </div>`).join('');

  resultDiv.style.display = 'block';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Auto-scan if cached result is fresh (< 10 minutes)
chrome.storage.local.get([currentUrl], (items) => {
  const cached = items[currentUrl];
  if (cached && Date.now() - cached.ts < 600_000) {
    renderResult(cached.result);
  }
});
