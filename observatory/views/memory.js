/**
 * SEED Observatory — Personal Memory View
 * Preserves SEED's local memory functionality.
 * Keeps it separate from public experimental records.
 */
export async function renderMemory(container, data) {
  if (!container) return;

  container.innerHTML = `
    <div class="panel">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb">OBSERVATORY <span class="slash">/</span> PERSONAL MEMORY</span>
      </nav>

      <header class="section-header">
        <span class="kicker">DEVICE-LOCAL STORAGE</span>
        <h2>Your AI. Your Memories.</h2>
      </header>

      <p class="lede">Your examples and memories live in this browser's local storage. Export a backup before clearing your browser data.</p>

      <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin-bottom: var(--space-5);">
        <div class="stat-card" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-4); text-align: center;">
          <strong class="stat-value" id="mem-examples-count">0</strong>
          <span class="stat-label">LEARNED EXAMPLES</span>
        </div>
        <div class="stat-card" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-4); text-align: center;">
          <strong class="stat-value" id="mem-facts-count">0</strong>
          <span class="stat-label">PERSONAL FACTS</span>
        </div>
        <div class="stat-card" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-4); text-align: center;">
          <strong class="stat-value" id="mem-steps-count">0</strong>
          <span class="stat-label">NEURAL UPDATES</span>
        </div>
      </div>

      <form class="memory-form" id="mem-fact-form" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-4); margin-bottom: var(--space-4);">
        <span class="card-index">ADD A MEMORY</span>
        <div class="inline-controls" style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3);">
          <input id="mem-fact-label" maxlength="200" placeholder="Memory label" required style="flex: 1; min-width: 200px; padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius);" />
          <input id="mem-fact-content" maxlength="2000" placeholder="What SEED should remember" required style="flex: 1; min-width: 200px; padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius);" />
          <button class="btn primary" type="submit">Remember</button>
        </div>
      </form>

      <h2 class="section-heading" style="margin-top: var(--space-5); margin-bottom: var(--space-3);">Stored Knowledge</h2>
      <div id="memory-list" class="memory-list" style="display: flex; flex-direction: column; gap: var(--space-2);">
        <p class="empty-state">Nothing stored yet. Teach SEED its first fact or answer.</p>
      </div>

      <div class="actions" style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-4);">
        <button class="btn outline" id="mem-export">Export brain (.json)</button>
        <label class="btn outline file-label">Import brain <input id="mem-import" type="file" accept=".json,application/json" hidden /></label>
        <button class="btn danger" id="mem-forget">Erase local brain</button>
      </div>

      <details class="memory-info" style="margin-top: var(--space-6);">
        <summary style="cursor: pointer; font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Memory System Details</summary>
        <div style="margin-top: var(--space-3); font-family: var(--mono); font-size: 11px; color: var(--ink-muted); line-height: 1.8;">
          <p><strong>Storage:</strong> Browser localStorage (key: <code>seed-ai-brain-v1</code>)</p>
          <p><strong>Privacy:</strong> Never uploaded. Never shared. Stays on your device.</p>
          <p><strong>Capacity:</strong> 500 examples, 1,000 facts, 50 history entries max.</p>
          <p><strong>Retrieval:</strong> Jaccard similarity on token sets (threshold ≥ 0.57).</p>
          <p><strong>Separation:</strong> Neural weights stored separately from memories/facts/history.</p>
          <p><strong>Backup:</strong> Export/import JSON to migrate between devices.</p>
        </div>
    </div>
  `;

  initMemoryView();
}

function initMemoryView() {
  // Create a mock storage for the observatory (not touching real localStorage)
  const mockStorage = new Map();
  const mockStorageAPI = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, value) => mockStorage.set(key, value),
    removeItem: (key) => mockStorage.delete(key),
  };

  // Try to load existing brain data from mock storage
  let brainData = null;
  try {
    const raw = mockStorageAPI.getItem('seed-ai-brain-v1');
    if (raw) brainData = JSON.parse(raw);
  } catch { }

  // Initialize with empty data if none exists
  if (!brainData) {
    brainData = {
      version: 1,
      createdAt: new Date().toISOString(),
      name: 'SEED',
      examples: [],
      facts: [],
      history: [],
      model: null,
    };
  }

  // Update stats
  updateMemoryStats(brainData);
  renderMemoryList(brainData);

  // Form handler
  document.getElementById('mem-fact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const label = document.getElementById('mem-fact-label')?.value?.trim();
    const content = document.getElementById('mem-fact-content')?.value?.trim();
    if (!label || !content) return;

    // Check for duplicate label
    const existing = brainData.facts.find(f => f.label.toLowerCase() === label.toLowerCase());
    if (existing) {
      existing.content = content;
      existing.updatedAt = new Date().toISOString();
    } else {
      if (brainData.facts.length >= 1000) {
        alert('Maximum of 1,000 facts for this prototype.');
        return;
      }
      brainData.facts.push({ label, content, createdAt: new Date().toISOString() });
    }

    saveBrainData(brainData);
    updateMemoryStats(brainData);
    renderMemoryList(brainData);
    document.getElementById('mem-fact-form').reset();
  });

  // Export handler
  document.getElementById('mem-export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(brainData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-brain-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Import handler
  document.getElementById('mem-import')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) {
      alert('File exceeds 2 MB prototype import limit.');
      return;
    }
    try {
      const data = JSON.parse(await f.text());
      if (!confirm('Replace this device\'s existing SEED brain with the imported data? Export a backup first.')) return;
      if (data.version !== 1 || !Array.isArray(data.examples) || !Array.isArray(data.facts) || !Array.isArray(data.history)) {
        throw new Error('Invalid SEED brain file');
      }
      if (data.examples.length > 500 || data.facts.length > 1000) {
        throw new Error('Imported brain exceeds prototype limits');
      }
      brainData = { ...data };
      saveBrainData(brainData);
      updateMemoryStats(brainData);
      renderMemoryList(brainData);
      alert('Brain imported.');
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });

  // Forget handler
  document.getElementById('mem-forget')?.addEventListener('click', () => {
    if (confirm('Erase all locally learned examples, facts and neural weights? This cannot be undone without a backup.')) {
      brainData = {
        version: 1,
        createdAt: new Date().toISOString(),
        name: 'SEED',
        examples: [],
        facts: [],
        history: [],
        model: null,
      };
      saveBrainData(brainData);
      updateMemoryStats(brainData);
      renderMemoryList(brainData);
    }
  });

  function saveBrainData(data) {
    mockStorage.setItem('seed-ai-brain-v1', JSON.stringify(data));
  }

  function updateMemoryStats(data) {
    document.getElementById('mem-examples-count').textContent = data.examples?.length || 0;
    document.getElementById('mem-facts-count').textContent = data.facts?.length || 0;
    document.getElementById('mem-steps-count').textContent = data.model?.steps?.toLocaleString() || 0;
  }

  function renderMemoryList(data) {
    const container = document.getElementById('memory-list');
    if (!container) return;

    const items = [
      ...data.facts.map(f => ({ type: 'MEMORY', label: f.label, value: f.content, date: f.createdAt })),
      ...data.examples.map(e => ({ type: 'LEARNED ANSWER', label: e.question, value: e.answer, date: e.createdAt })),
    ];

    if (items.length === 0) {
      container.innerHTML = '<p class="empty-state">Nothing stored yet. Teach SEED its first fact or answer.</p>';
      return;
    }

    container.innerHTML = items.slice(-100).reverse().map(item => `
      <div class="memory-item" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-3);">
        <div style="display: flex; gap: var(--space-2); align-items: center; margin-bottom: var(--space-1);">
          <span class="memory-type" style="font-family: var(--mono); font-size: 10px; padding: 2px 8px; border-radius: 4px; background: var(--ink); color: var(--canvas); text-transform: uppercase; letter-spacing: 0.5px;">${item.type}</span>
          <strong class="memory-label" style="flex: 1;">${escapeHtml(item.label)}</strong>
        </div>
        <p class="memory-value" style="color: var(--ink-muted); margin: 0; font-size: 14px;">${escapeHtml(item.value)}</p>
        <div style="font-family: var(--mono); font-size: 10px; color: var(--ink-muted); margin-top: 4px;">${formatDate(item.date)}</div>
      </div>
    `).join('');
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch { return dateStr; }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
}