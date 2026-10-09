/**
 * SEED Observatory — Arena View
 * Comparative scientific environment for architecture metrics.
 */
export async function renderArena(container, data) {
  if (!container) return;

  const models = data.models || [];
  const experiments = data.experiments || [];

  container.innerHTML = `
    <div class="panel">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb">OBSERVATORY <span class="slash">/</span> ARENA</span>
      </nav>

      <header class="section-header">
        <span class="kicker">COMPARATIVE ANALYSIS</span>
        <h2>Architecture Metrics Comparison</h2>
      </header>

      <p class="lede">Select models to compare their actual measured metrics. Only architectures with compatible datasets and evaluation procedures are directly comparable.</p>

      <div class="arena-controls" style="margin-bottom: var(--space-4); display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;">
        <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Compare:</label>
        <select id="arena-model-a" class="btn outline" style="min-width: 180px;">
          <option value="">Select Model A</option>
        </select>
        <span style="color: var(--ink-muted);">vs</span>
        <select id="arena-model-b" class="btn outline" style="min-width: 180px;">
          <option value="">Select Model B</option>
        </select>
        <button class="btn primary" id="arena-compare">Compare</button>
      </div>

      <div class="arena-results" id="arena-results" style="margin-top: var(--space-5);">
        <p class="empty-state">Select two models and click Compare to see side-by-side metrics.</p>
      </div>

      <section class="section" style="margin-top: var(--space-7);" aria-labelledby="all-metrics-title">
        <header class="section-header">
          <span class="kicker">ALL ARCHITECTURES</span>
          <h2 id="all-metrics-title">Full Metrics Table</h2>
        </header>
        <div class="table-wrapper" style="overflow-x: auto;">
          <table class="arena-table" id="arena-full-table" role="table">
            <thead>
              <tr>
                <th>Architecture</th>
                <th>Family</th>
                <th>Status</th>
                <th>Parameters</th>
                <th>Context</th>
                <th>Best Val BPC</th>
                <th>Test BPC</th>
                <th>Training Time</th>
                <th>Peak RAM</th>
              </tr>
            </thead>
            <tbody id="arena-table-body"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  // Populate model selectors
  models = data.models || [];
  const selectorA = document.getElementById('arena-model-a');
  const selectorB = document.getElementById('arena-model-b');

  models.forEach(model => {
    if (model.status === 'implemented' || model.status === 'trained') {
      const optA = document.createElement('option');
      optA.value = model.id;
      optA.textContent = `${model.id.toUpperCase()} (${model.parameters?.toLocaleString()} params)`;
      selectorA.appendChild(optA.cloneNode(true));
      selectorB.appendChild(optA);
    }
  });

  // Populate full table
  populateFullTable(data, models);

  // Compare button handler
  document.getElementById('arena-compare')?.addEventListener('click', () => {
    const modelA = selectorA.value;
    const modelB = selectorB.value;
    if (!modelA || !modelB) {
      alert('Please select both models.');
      return;
    }
    if (modelA === modelB) {
      alert('Please select two different models.');
      return;
    }
    showComparison(data, modelA, modelB);
  });
}

function populateFullTable(data, models) {
  const tbody = document.getElementById('arena-table-body');
  if (!tbody) return;

  const experiments = data.experiments || [];

  tbody.innerHTML = models.map(model => {
    const latestExp = experiments
      .filter(e => e.architecture_id === model.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const valBpc = latestExp?.validation?.bitsPerCharacter?.toFixed(2) || '—';
    const testBpc = latestExp?.test?.bitsPerCharacter?.toFixed(2) || '—';
    const trainTime = latestExp?.training?.durationMs ? `${(latestExp.training.durationMs / 60000).toFixed(1)} min` : '—';
    const peakRam = latestExp?.training?.peakMemoryBytes ? `${(latestExp.training.peakMemoryBytes / 1e6).toFixed(1)} MB` : '—';

    return `
      <tr>
        <td><span class="architecture-name">${model.id.toUpperCase()}</span></td>
        <td>${model.architecture || '—'}</td>
        <td><span class="status-badge ${model.status === 'implemented' ? '' : 'planned'}">${model.status?.toUpperCase() || 'PROPOSED'}</span></td>
        <td>${model.parameters?.toLocaleString() || '—'}</td>
        <td>${model.context_chars ? model.context_chars + ' chars' : '—'}</td>
        <td>${valBpc}</td>
        <td>${testBpc}</td>
        <td>${trainTime}</td>
        <td>${peakRam}</td>
      </tr>
    `;
  }).join('');
}

function showComparison(data, modelAId, modelBId) {
  const models = data.models || [];
  const experiments = data.experiments || [];

  const modelA = models.find(m => m.id === modelAId);
  const modelB = models.find(m => m.id === modelBId);

  if (!modelA || !modelB) return;

  const expA = experiments.filter(e => e.architecture_id === modelAId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  const expB = experiments.filter(e => e.architecture_id === modelBId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  const container = document.getElementById('arena-results');
  if (!container) return;

  const compat = checkCompatibility(expA, expB);

  container.innerHTML = `
    <div class="comparison-header">
      <h3>${modelAId.toUpperCase()} vs ${modelBId.toUpperCase()}</h3>
      <div class="compatibility-badge ${compat.compatible ? 'compatible' : 'incompatible'}">
        ${compat.compatible ? '✓ Compatible for direct comparison' : '⚠ Incompatible: ' + compat.reason}
      </div>
    </div>

    <div class="comparison-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
      ${renderModelColumn(modelA, expA, 'A')}
      ${renderModelColumn(modelB, expB, 'B')}
    </div>

    ${compat.compatible ? `
      <h4 style="margin-top: var(--space-5);">Key Differences</h4>
      <div class="differences-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-3);">
        ${renderDifferences(modelA, modelB, expA, expB).map(d => `<div class="difference-item">${d}</div>`).join('')}
      </div>
    ` : ''}
  `;
}

function checkCompatibility(expA, expB) {
  if (!expA || !expB) return { compatible: false, reason: 'Missing experiment data for one or both models' };
  if (expA.dataset?.trainChars !== expB.dataset?.trainChars) {
    return { compatible: false, reason: 'Different training data sizes' };
  }
  if (expA.config?.seed !== expB.config?.seed) {
    return { compatible: false, reason: 'Different random seeds (results not directly comparable)' };
  }
  return { compatible: true, reason: '' };
}

function renderModelColumn(model, exp, label) {
  const valBpc = exp?.validation?.bitsPerCharacter?.toFixed(2) || '—';
  const testBpc = exp?.test?.bitsPerCharacter?.toFixed(2) || '—';
  const trainTime = exp?.training?.durationMs ? `${(exp.training.durationMs / 60000).toFixed(1)} min` : '—';
  const peakRam = exp?.training?.peakMemoryBytes ? `${(exp.training.peakMemoryBytes / 1e6).toFixed(1)} MB` : '—';
  const params = model.parameters?.toLocaleString() || '—';
  const ctx = model.context_chars ? `${model.context_chars} chars` : '—';

  return `
    <div class="comparison-card" style="background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-4);">
      <h4>${model.id.toUpperCase()} (Model ${label})</h4>
      <dl style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-2) var(--space-4); font-size: 13px;">
        <dt>Family</dt><dd>${model.architecture || '—'}</dt>
        <dt>Status</dt><dd><span class="status-badge ${model.status === 'implemented' ? '' : 'planned'}">${model.status?.toUpperCase() || 'PROPOSED'}</span></dd>
        <dt>Parameters</dt><dd>${model.parameters?.toLocaleString() || '—'}</dd>
        <dt>Context</dt><dd>${ctx}</dd>
        <dt>Val BPC</dt><dd>${valBpc}</dd>
        <dt>Test BPC</dt><dd>${testBpc}</dd>
        <dt>Train Time</dt><dd>${trainTime}</dd>
        <dt>Peak RAM</dt><dd>${peakRam}</dd>
        <dt>Architecture</dt><dd>${model.architecture || '—'}</dd>
      </dl>
    </div>
  `;
}

function renderDifferences(modelA, modelB, expA, expB) {
  const diffs = [];
  if (modelA.parameters !== modelB.parameters) diffs.push(`Parameters: ${modelA.parameters?.toLocaleString()} vs ${modelB.parameters?.toLocaleString()}`);
  if (modelA.context_chars !== modelB.context_chars) diffs.push(`Context: ${modelA.context_chars || '?'} vs ${modelB.context_chars || '?'}`);
  if (expA?.validation?.bitsPerCharacter && expB?.validation?.bitsPerCharacter) {
    const diff = (expA.validation.bitsPerCharacter - expB.validation.bitsPerCharacter).toFixed(2);
    diffs.push(`Val BPC diff: ${diff > 0 ? '+' : ''}${diff} (${modelA.id} ${diff > 0 ? 'higher' : 'lower'})`);
  }
  if (expA?.training?.durationMs && expB?.training?.durationMs) {
    const diff = ((expA.training.durationMs - expB.training.durationMs) / 60000).toFixed(1);
    diffs.push(`Train time diff: ${diff > 0 ? '+' : ''}${diff} min`);
  }
  return diffs.length > 0 ? diffs : ['No significant differences in available metrics.'];
}