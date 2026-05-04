import './style.css';

interface SecretResponse {
  id: string;
  shareUrl: string;
  expiresAt: number;
  expiresIn: number;
}

interface SecretCheckResponse {
  valid: boolean;
}

interface SecretContentResponse {
  content: string;
}

// Countdown management: keep a single interval and helper to clear it
let countdownId: number | null = null;

function clearCountdown() {
  if (countdownId !== null) {
    clearInterval(countdownId);
    countdownId = null;
  }
}

const app = document.getElementById('app') as HTMLDivElement;

function render() {
  const path = window.location.pathname;

  if (path.startsWith('/share/')) {
    const secretId = path.substring(7);
    renderViewPage(secretId);
  } else {
    renderMainPage();
  }
}

function renderMainPage() {
  // Stop any previous countdown when re-rendering the main page
  clearCountdown();
  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h1>Share a Secret</h1>
        <p class="description">Share sensitive information via a one-time link. Links expire in 5 minutes.</p>
        
        <div class="form-group">
          <label for="secretInput">Your Secret:</label>
          <textarea id="secretInput" placeholder="Enter your secret here..." rows="6"></textarea>
        </div>
        
        <button id="shareBtn" class="btn btn-primary">Generate Share Link</button>
        
        <div id="resultContainer" class="result-container hidden">
          <div class="success-message">
            <h2>Link Generated!</h2>
            <p>Share this link with others:</p>
            <div class="link-container">
              <input type="text" id="shareLink" readonly class="link-input" />
              <button id="copyBtn" class="btn btn-secondary">Copy Link</button>
            </div>
            <p class="expiry-info">⏱️ This link expires in <span id="expiryTime">5 minutes</span></p>
          </div>
        </div>
      </div>
    </div>
  `;

  const shareBtn = document.getElementById('shareBtn') as HTMLButtonElement;
  const secretInput = document.getElementById('secretInput') as HTMLTextAreaElement;
  const resultContainer = document.getElementById('resultContainer') as HTMLDivElement;
  const shareLink = document.getElementById('shareLink') as HTMLInputElement;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;

  shareBtn.addEventListener('click', async () => {
    const content = secretInput.value.trim();

    if (!content) {
      alert('Please enter a secret');
      return;
    }

    shareBtn.disabled = true;
    shareBtn.textContent = 'Generating...';

    try {
      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to create secret');

      const data = (await response.json()) as SecretResponse;
      shareLink.value = data.shareUrl;
      resultContainer.classList.remove('hidden');
      secretInput.value = '';

      // Use expiresAt (absolute ms) to compute remaining reliably
      clearCountdown();
      const expirySpan = document.getElementById('expiryTime') as HTMLSpanElement;
      const expiresAt = data.expiresAt;

      function updateExpiryDisplay() {
        const secsLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        if (secsLeft <= 0) {
          expirySpan.textContent = 'Expired';
          clearCountdown();
        } else {
          expirySpan.textContent = `${secsLeft} seconds`;
        }
      }

      // Update immediately and then every second, computing from expiresAt
      updateExpiryDisplay();
      countdownId = window.setInterval(() => {
        updateExpiryDisplay();
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create secret. Please try again.');
    } finally {
      shareBtn.disabled = false;
      shareBtn.textContent = 'Generate Share Link';
    }
  });

  copyBtn.addEventListener('click', () => {
    shareLink.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy Link';
    }, 2000);
  });
}

function renderViewPage(secretId: string) {
  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h1>View Secret</h1>
        <div id="loadingContainer" class="loading">
          <p>Loading secret...</p>
        </div>
        <div id="secretContainer" class="hidden">
          <div class="secret-content">
            <h2>Secret Content:</h2>
            <div class="content-box">
              <pre id="secretContent"></pre>
            </div>
            <p class="info-message">ℹ️ This secret has been viewed and can no longer be accessed.</p>
            <a href="/" class="btn btn-primary">Share Another Secret</a>
          </div>
        </div>
        <div id="errorContainer" class="hidden">
          <div class="error-message">
            <h2>Secret Not Found</h2>
            <p id="errorMessage"></p>
            <a href="/" class="btn btn-primary">Create a New Secret</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const loadingContainer = document.getElementById('loadingContainer') as HTMLDivElement;
  const secretContainer = document.getElementById('secretContainer') as HTMLDivElement;
  const errorContainer = document.getElementById('errorContainer') as HTMLDivElement;
  const secretContent = document.getElementById('secretContent') as HTMLPreElement;
  const errorMessage = document.getElementById('errorMessage') as HTMLParagraphElement;

  fetchSecret(secretId)
    .then((content) => {
      loadingContainer.classList.add('hidden');
      secretContent.textContent = content;
      secretContainer.classList.remove('hidden');
    })
    .catch((error) => {
      loadingContainer.classList.add('hidden');
      errorMessage.textContent = error.message;
      errorContainer.classList.remove('hidden');
    });
}

async function fetchSecret(id: string): Promise<string> {
  const response = await fetch(`/api/secrets/${id}`);

  if (response.status === 404) {
    throw new Error('Secret not found or has expired.');
  }

  if (!response.ok) {
    throw new Error('Failed to retrieve secret.');
  }

  const data = (await response.json()) as SecretContentResponse;
  return data.content;
}

window.addEventListener('popstate', render);
render();
