/**
 * SEED Observatory — Overview View
 * Shows current model status, metrics, evolution strip, learning curve, research entries.
 */
export async function renderOverview(container, data) {
  if (!container) return;

  // Update metric cards
  updateMetrics(data);

  // Render evolution strip
  renderEvolutionStrip(data);

  // Render learning chart
  renderLearningChart(data);

  // Render research list
  renderResearchList(data);
}

function updateMetrics(data) {
  const models = data.models || [];
  const experiments = data.experiments || [];
  const latestModel = models.find(m => m.status === 'implemented') || models[0];
  const latestExp = experiments[experiments.length - 1];

  const metricModel = document.getElementById('metric-model');
  const metricRuns = document.getElementById('metric-runs');
  const metricBpc = document.getElementById('metric-bpc');
  const metricLatest = document.getElementById('metric-latest');

  if (metricModel) metricModel.textContent = latestModel?.id?.toUpperCase() || 'SEED-0';
  if (metricRuns) metricRuns.textContent = experiments.length.toString();
  if (metricBpc) {
    if (latestExp?.validation?.bitsPerCharacter) {
      metricBpc.textContent = latestExp.validation.bitsPerCharacter.toFixed(2);
    } else if (latestModel?.best_validation_bpc) {
      metricBpc.textContent = latestModel.best_validation_bpc.toFixed(2);
    } else {
      metricBpc.textContent = 'NOT YET MEASURED';
    }
  }
  if (metricLatest) metricLatest.textContent = latestExp?.experiment_id?.slice(0, 8) || '—';
}

function renderEvolutionStrip(data) {
  const container = document.getElementById('evolution-strip');
  if (!container) return;

  const models = data.models || [];
  const archOrder = [
    'seed-0', 'seed-ffn', 'seed-rnn', 'seed-gru', 'seed-lstm',
    'seed-transformer', 'seed-rwkv', 'seed-ssm', 'seed-liquid',
    'seed-memory', 'seed-sprout'
  ];

  const archLabels = {
    'seed-0': 'SEED-0',
    'seed-ffn': 'SEED-FFN',
    'seed-rnn': 'SEED-RNN',
    'seed-gru': 'SEED-GRU',
    'seed-lstm': 'SEED-LSTM',
    'seed-transformer': 'SEED-TX',
    'seed-rwkv': 'SEED-RWKV',
    'seed-ssm': 'SEED-SSM',
    'seed-liquid': 'SEED-LIQUID',
    'seed-memory': 'SEED-MEM',
    'seed-sprout': 'SEED-SPROUT'
  };

  const statusLabels = {
    'implemented': 'IMPLEMENTED',
    'trained': 'TRAINED',
    'planned': 'PLANNED',
    'research': 'RESEARCH',
    'proposed': 'PROPOSED'
  };

  container.innerHTML = archOrder.map(id => {
    const model = models.find(m => m.id === id);
    const isProposed = !model || model.status !== 'implemented';
    const status = model?.status || 'proposed';
    const params = model?.parameters ? model.parameters.toLocaleString() : '—';
    const ctx = model?.context_chars ? `${model.context_chars} chars` : '—';

    return `
      <div class="evolution-node ${isProposed ? 'proposed' : ''}" role="listitem" tabindex="0">
        <div class="node-name">${archLabels[id] || id.toUpperCase()}</div>
        <div class="node-meta">
          <span>${params} params</span>
          <span>${ctx}</span>
        </div>
        <span class="node-status">${archLabels[id] ? statusLabels[status] || status.toUpperCase() : 'PROPOSED'}</span>
      </div>
    `;
  }).join('');
}

function renderLearningChart(data) {
  const canvas = document.getElementById('learning-canvas');
  const emptyEl = document.getElementById('learning-empty');
  if (!canvas) return;

  const experiments = data.experiments || [];
  const hasData = experiments.some(e => e.training?.trainingCurve?.length > 0);

  if (!hasData) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Clear
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Draw axes and grid
  const padding = 50;
  const chartWidth = rect.width - 2 * padding;
  const chartHeight = rect.height - 2 * padding;

  ctx.strokeStyle = '#E5E5E5';
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
  }

  // Vertical grid lines
  for (let i = 0; i <= 5; i++) {
    const x = padding + (chartWidth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + chartHeight);
    ctx.stroke();
  }

  // Draw training curves for each experiment
  const experimentsWithCurves = experiments.filter(e => e.training?.trainingCurve?.length > 0);

  experimentsWithCurves.forEach((exp, expIdx) => {
    const curve = exp.training.trainingCurve;
    if (curve.length < 2) return;

    // Color palette
    const colors = ['#101010', '#707070', '#A0A0A0', '#D0D0D0'];
    const color = colors[expIdx % colors.length];

    // Find min/max for scaling
    const steps = curve.map(p => p.step);
    const losses = curve.map(p => p.loss);
    const minStep = Math.min(...steps);
    const maxStep = Math.max(...steps);
    const minLoss = Math.min(...losses);
    const maxLoss = Math.max(...losses);

    // Draw curve
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    curve.forEach((point, i) => {
      const x = padding + ((point.step - minStep) / (maxStep - minStep || 1)) * chartWidth;
      const y = padding + chartHeight - ((point.loss - minLoss) / (maxLoss - minLoss || 1)) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    curve.forEach(point => {
      const x = padding + ((point.step - minStep) / (maxStep - minStep || 1)) * chartWidth;
      const y = padding + chartHeight - ((point.loss - minLoss) / (maxLoss - minLoss || 1)) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  });

  // Draw axis labels
  ctx.font = '11px "DM Mono", monospace';
  ctx.fillStyle = '#707070';
  ctx.textAlign = 'center';
  ctx.fillText('Training Step', canvas.width / 2, canvas.height - 10);
  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Loss', 0, 0);
  ctx.restore();
}

// Resize handler for chart
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Re-render will happen on next view switch
  }, 100);
});

export function renderResearchList(data) {
  const container = document.getElementById('research-list');
  if (!container) return;

  const entries = data.research_entries || [];

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state">NO RESEARCH ENTRIES PUBLISHED YET</p>';
    return;
  }

  container.innerHTML = entries.map(entry => `
    <article class="research-card">
      <header>
        <time class="research-date" datetime="${entry.date}">${formatDate(entry.date)}</time>
        <h3 class="research-hypothesis">${escapeHtml(entry.hypothesis)}</h3>
      </header>
      <div class="research-tags">
        ${(entry.tags || []).map(t => `<span class="research-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      ${entry.outcome ? `<div class="research-outcome">Outcome: ${escapeHtml(entry.outcome)}</div>` : ''}
      ${entry.experiment_id ? `<div class="research-outcome">Experiment: <code>${escapeHtml(entry.experiment_id)}</code></div>` : ''}
    </article>
  `).join('');
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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