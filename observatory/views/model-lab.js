/**
 * SEED Observatory — Model Lab View
 * Detailed model-inspection view with architectural structure, layers, dimensions, and parameter counts.
 */
export async function renderModelLab(container, data) {
  if (!container) return;

  const models = data.models || [];

  container.innerHTML = `
    <div class="panel">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb">OBSERVATORY <span class="slash">/</span> MODEL LAB</span>
      </nav>

      <header class="section-header">
        <span class="kicker">MODEL INSPECTION</span>
        <h2>Architectural Structure & Parameters</h2>
      </header>

      <p class="lede">Display architectural structure, layers, dimensions, parameter counts, and available implementation information.</p>

      <div class="model-selector" style="margin-bottom: var(--space-4); display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;">
        <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Select Model:</label>
        <select id="lab-model-select" class="btn outline" style="min-width: 280px;">
          <option value="">Select a model...</option>
        </select>
        <button class="btn primary" id="lab-load">Inspect</button>
      </div>

      <div class="model-grid" id="model-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4);">
        <!-- Model cards will be populated here -->
      </div>

      <div class="model-detail hidden" id="model-detail" style="margin-top: var(--space-6);" aria-live="polite">
        <!-- Detailed view for selected model -->
      </div>
    </div>
  `;

  initModelLab(data);
}

function initModelLab(data) {
  const models = data.models || [];

  // Populate selector
  const selector = document.getElementById('lab-model-select');
  models.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model.id;
    opt.textContent = `${model.id.toUpperCase()} (${model.parameters?.toLocaleString()} params, ${model.status})`;
    selector.appendChild(opt);
  });

  // Render model cards
  renderModelCards(data.models || []);

  // Load button handler
  document.getElementById('lab-load')?.addEventListener('click', () => {
    const modelId = document.getElementById('lab-model-select').value;
    if (!modelId) return alert('Select a model first.');
    showModelDetail(data.models.find(m => m.id === modelId));
  });

  // Initial render
  renderModelCards(data.models || []);
}

function renderModelCards(models) {
  const grid = document.getElementById('model-grid');
  if (!grid) return;

  if (models.length === 0) {
    grid.innerHTML = '<p class="empty-state">NO MODELS AVAILABLE</p>';
    return;
  }

  grid.innerHTML = models.map(model => {
    const isImplemented = model.status === 'implemented';
    return `
      <article class="model-card" data-id="${model.id}" tabindex="0" role="button" aria-pressed="false">
        <header>
          <h3>${model.id.toUpperCase()}</h3>
          <span class="status-badge ${model.status === 'implemented' ? '' : 'proposed'}">${model.status?.toUpperCase() || 'PROPOSED'}</span>
        </header>
        <div class="model-specs">
          <div class="model-spec"><span class="model-spec-label">Family</span><span class="model-spec-value">${model.architecture || '—'}</span></div>
          <div class="model-spec"><span class="model-spec-label">Parameters</span><span class="model-spec-value">${model.parameters?.toLocaleString() || '—'}</span></div>
          <div class="model-spec"><span class="model-spec-label">Context</span><span class="model-spec-value">${model.context_chars ? model.context_chars + ' chars' : '—'}</span></div>
          <div class="model-spec"><span class="model-spec-label">Best Val BPC</span><span class="model-spec-value">${model.best_validation_bpc?.toFixed(2) || '—'}</span></div>
          <div class="model-spec"><span class="model-spec-label">Status</span><span class="model-spec-value"><span class="status-badge ${model.status === 'implemented' ? '' : 'proposed'}">${model.status?.toUpperCase() || 'PROPOSED'}</span></span></div>
        </div>
      </article>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.model-card').forEach(card => {
    card.addEventListener('click', () => {
      const modelId = card.dataset.id;
      showModelDetail(window.currentLabData?.models?.find(m => m.id === modelId) || { id: modelId });
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

function showModelDetail(model) {
  const detailPanel = document.getElementById('model-detail');
  if (!detailPanel) return;

  if (!model) {
    detailPanel.innerHTML = '<p class="empty-state">Model not found.</p>';
    detailPanel.classList.remove('hidden');
    return;
  }

  const params = model.parameters?.toLocaleString() || '—';
  const ctx = model.context_chars ? `${model.context_chars} chars` : '—';
  const bestBpc = model.best_validation_bpc?.toFixed(2) || '—';
  const status = model.status || 'proposed';
  const archInfo = getArchitectureInfo(model.id);

  detailPanel.innerHTML = `
    <div class="detail-header">
      <h3>${model.id.toUpperCase()}</h3>
      <button class="btn outline" id="close-detail">Close</button>
    </div>
    <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4);">
      <div class="detail-section">
        <h4>Architecture Specification</h4>
        <dl style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-2) var(--space-4); font-size: 13px;">
          <dt>ID</dt><dd>${model.id}</dd>
          <dt>Family</dt><dd>${archInfo?.family || 'unknown'}</dd>
          <dt>Status</dt><dd><span class="status-badge ${model.status === 'implemented' ? '' : 'proposed'}">${model.status?.toUpperCase() || 'PROPOSED'}</span></dd>
          <dt>Parameters</dt><dd>${model.parameters?.toLocaleString() || '—'}</dd>
          <dt>Context Length</dt><dd>${model.context_chars ? model.context_chars + ' chars' : '—'}</dd>
          <dt>Best Validation BPC</dt><dd>${model.best_validation_bpc?.toFixed(2) || '—'}</dd>
          <dt>Architecture</dt><dd>${model.architecture || '—'}</dd>
        </dl>
      </div>
      <div class="detail-section">
        <h4>Layer Structure</h4>
        <div class="layer-tree" id="layer-tree-${model.id}" style="font-family: var(--mono); font-size: 12px; line-height: 1.8;">
          ${renderLayerTree(model)}
        </div>
      </div>
      <div class="detail-section">
        <h4>Experiments</h4>
        <p class="empty-state">No experiments published for this model yet.</p>
      </div>
      <div class="detail-section">
        <h4>Checkpoints</h4>
        <p class="empty-state">No checkpoints published yet.</p>
      </div>
    `;

  document.getElementById('model-detail').classList.remove('hidden');
  document.getElementById('model-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('close-detail')?.addEventListener('click', () => {
    document.getElementById('model-detail').classList.add('hidden');
  });
}

function getArchitectureInfo(modelId) {
  const archMap = {
    'seed-0': { family: 'feedforward', description: 'Original three-character contextual neural language model' },
    'seed-ffn': { family: 'feedforward', description: 'Improved feedforward with extended context' },
    'seed-rnn': { family: 'recurrent', description: 'Simple recurrent neural network' },
    'seed-gru': { family: 'recurrent', description: 'Gated recurrent unit' },
    'seed-lstm': { family: 'recurrent', description: 'Long short-term memory' },
    'seed-transformer': { family: 'attention', description: 'Compact causal Transformer' },
    'seed-rwkv': { family: 'hybrid-recurrence', description: 'RWKV-style linear attention' },
    'seed-ssm': { family: 'state-space', description: 'Selective state-space model' },
    'seed-liquid': { family: 'continuous-time', description: 'Liquid time-constant network' },
    'seed-memory': { family: 'memory-augmented', description: 'Neural controller with external memory' },
    'seed-sprout': { family: 'adaptive', description: 'Structurally plastic network with growth/pruning' },
  };
  return archMap[modelId] || { family: 'unknown', description: 'No description available' };
}

function renderLayerTree(model) {
  const arch = model.id;
  let layers = [];

  switch (arch) {
    case 'seed-0':
      layers = [
        'Input: 3-char context (24 features)',
        'Embedding: 96 × 8 = 768 params',
        'Hidden: Linear(24→48) + tanh = 1,200 params',
        'Output: Linear(48→96) + softmax = 4,704 params',
      ];
      break;
    case 'seed-ffn':
      layers = [
        `Input: ${model.context_chars || 40}-char context (${(model.context_chars || 40) * (model.embedDim || 16)} features)`,
        `Embedding: 96 × ${model.embedDim || 16} = ${96 * (model.embedDim || 16)} params`,
        `Hidden: Linear(${((model.context_chars || 40) * (model.embedDim || 16))}→${model.hiddenDim || 32}) + tanh = ${((model.context_chars || 40) * (model.embedDim || 16)) * (model.hiddenDim || 32)} params`,
        `Output: Linear(${model.hiddenDim || 32}→96) + softmax = ${(model.hiddenDim || 32) * 96} params`,
      ];
      break;
    case 'seed-gru':
      layers = [
        `Embedding: 96 × ${model.embedDim || 16} = ${96 * (model.embedDim || 16)} params`,
        `GRU (${model.numLayers || 1} layer): 3 × (${model.embedDim || 16}×${model.hiddenDim || 64} + ${model.hiddenDim || 64}² + ${model.hiddenDim || 64}) = ${3 * ((model.embedDim || 16) * (model.hiddenDim || 64) + (model.hiddenDim || 64) ** 2 + (model.hiddenDim || 64))} params`,
        `Output: ${model.hiddenDim || 64} × 96 = ${(model.hiddenDim || 64) * 96} params`,
      ];
      break;
    case 'seed-lstm':
      layers = [
        `Embedding: 96 × ${model.embedDim || 16} = ${96 * (model.embedDim || 16)} params`,
        `LSTM (${model.numLayers || 1} layer): 4 × (${model.embedDim || 16}×${model.hiddenDim || 64} + ${model.hiddenDim || 64}² + ${model.hiddenDim || 64}) = ${4 * ((model.embedDim || 16) * (model.hiddenDim || 64) + (model.hiddenDim || 64) ** 2 + (model.hiddenDim || 64))} params`,
        `Output: ${model.hiddenDim || 64} × 96 = ${(model.hiddenDim || 64) * 96} params`,
      ];
      break;
    case 'seed-transformer':
      layers = [
        `Token Embedding: 96 × ${model.embedDim || 24} = ${96 * (model.embedDim || 24)} params`,
        `Positional Embedding: ${model.contextLength || 40} × ${model.embedDim || 24} = ${(model.contextLength || 40) * (model.embedDim || 24)} params`,
        `Transformer Block (${model.numLayers || 1}): Attention(4×${model.embedDim || 24}²) + FFN(2×${model.embedDim || 24}×${model.hiddenDim || 96}) + 2×LN = ${4 * (model.embedDim || 24) ** 2 + 2 * (model.embedDim || 24) * (model.hiddenDim || 96) + 4 * (model.embedDim || 24)} params/layer`,
        `Output: ${model.tiedOutput ? 'tied' : (model.embedDim || 24) + '×96'} params`,
      ];
      break;
    default:
      layers = ['Architecture details not specified for this model.'];
  }

  return layers.map((layer, i) => `
    <div style="padding: var(--space-2) 0; border-bottom: 1px solid var(--border);">
      <span style="color: var(--ink-muted); font-family: var(--mono); font-size: 11px;">Layer ${i + 1}:</span>
      <span style="margin-left: var(--space-2);">${layer}</span>
    </div>
  `).join('');
}