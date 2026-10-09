/**
 * SEED Observatory — Learning View
 * Displays training curves, validation curves, real checkpoint history, and text-generation samples.
 */
export async function renderLearning(container, data) {
  if (!container) return;

  const experiments = data.experiments || [];

  container.innerHTML = `
    <div class="panel">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb">OBSERVATORY <span class="slash">/</span> LEARNING</span>
      </nav>

      <header class="section-header">
        <span class="kicker">TRAINING VISUALIZATION</span>
        <h2>Learning Curves & Checkpoint Replay</h2>
      </header>

      <p class="lede">Real training curves and recorded outputs at saved checkpoints. Untrained models display blank states, not synthetic predictions.</p>

      <div class="learning-controls" style="margin-bottom: var(--space-4); display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;">
        <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Experiment:</label>
        <select id="learning-exp-select" class="btn outline" style="min-width: 280px;">
          <option value="">Select an experiment...</option>
        </select>
        <button class="btn primary" id="learning-load">Load Curves</button>
      </div>

      <div class="learning-charts" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-5);">
        <div class="chart-container" style="height: 300px;">
          <canvas id="loss-canvas" aria-label="Training and validation loss curves"></canvas>
          <p class="chart-empty" id="loss-empty">NO TRAINING CURVE DATA</p>
        </div>
        <div class="chart-container" style="height: 300px;">
          <canvas id="bpc-canvas" aria-label="Validation BPC curve"></canvas>
          <p class="chart-empty" id="bpc-empty">NO VALIDATION BPC DATA</p>
        </div>
      </div>

      <section class="section" style="margin-top: var(--space-7);" aria-labelledby="checkpoint-replay-title">
        <header class="section-header">
          <span class="kicker">CHECKPOINT REPLAY</span>
          <h2 id="checkpoint-replay-title">Recorded Generation at Saved Checkpoints</h2>
        </header>
        <p class="lede">Real outputs from saved model checkpoints. Scrub by training step; dates/timestamps are experiment metadata, not simulated time.</p>
        <div class="replay-controls" style="margin-bottom: var(--space-4); display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;">
          <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Experiment:</label>
          <select id="replay-exp-select" class="btn outline" style="min-width: 280px;">
            <option value="">Select experiment...</option>
          </select>
          <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Checkpoint:</label>
          <select id="replay-checkpoint-select" class="btn outline" style="min-width: 200px;" disabled>
            <option value="">Select checkpoint...</option>
          </select>
          <button class="btn primary" id="replay-generate" disabled>Generate Sample</button>
        </div>
        <div class="replay-output" style="margin-top: var(--space-4); padding: var(--space-4); background: var(--recessed); border: 1px solid var(--border); border-radius: var(--radius); font-family: var(--mono); font-size: 13px; min-height: 80px; white-space: pre-wrap; word-break: break-word;" id="replay-output" aria-live="polite">
          <p class="empty-state" style="margin: 0;">Select experiment and checkpoint, then click Generate Sample.</p>
        </div>

        <div class="checkpoint-list" style="margin-top: var(--space-5);" id="checkpoint-list" aria-label="Available checkpoints">
          <p class="empty-state">Select an experiment to see available checkpoints.</p>
        </div>
      </section>
    </div>
  `;

  initLearningView(data);
}

function initLearningView(data) {
  const experiments = data.experiments || [];

  // Populate experiment selectors
  const expSelect = document.getElementById('learning-exp-select');
  const replayExpSelect = document.getElementById('replay-exp-select');

  experiments.forEach(exp => {
    const opt = document.createElement('option');
    opt.value = exp.experiment_id;
    opt.textContent = `${exp.experiment_id?.slice(0, 8)} — ${exp.architecture_id} — ${exp.timestamp?.slice(0, 10)}`;
    expSelect.appendChild(opt.cloneNode(true));
    replayExpSelect.appendChild(opt);
  });

  // Learning curves load
  document.getElementById('learning-load')?.addEventListener('click', () => {
    const expId = document.getElementById('learning-exp-select').value;
    if (!expId) return alert('Select an experiment first.');
    loadLearningCurves(data, expId);
  });

  // Replay experiment change
  document.getElementById('replay-exp-select')?.addEventListener('change', async () => {
    const expId = document.getElementById('replay-exp-select').value;
    const checkpointSelect = document.getElementById('replay-checkpoint-select');
    const genBtn = document.getElementById('replay-generate');
    const checkpointList = document.getElementById('checkpoint-list');

    if (!expId) {
      checkpointSelect.disabled = true;
      checkpointSelect.innerHTML = '<option value="">Select checkpoint...</option>';
      genBtn.disabled = true;
      checkpointList.innerHTML = '<p class="empty-state">Select an experiment to see available checkpoints.</p>';
      return;
    }

    // Load checkpoints for this experiment
    const exp = data.experiments?.find(e => e.experiment_id === expId);
    if (exp?.checkpoints?.length) {
      checkpointSelect.innerHTML = '<option value="">Select checkpoint...</option>' +
        exp.checkpoints.map(cp => `<option value="${cp.checkpoint_id}">${cp.step} steps (BPC: ${cp.validation_bpc?.toFixed(2) || '—'})</option>`).join('');
      checkpointSelect.disabled = false;
      genBtn.disabled = false;

      checkpointList.innerHTML = exp.checkpoints.map(cp => `
        <div class="checkpoint-item" style="padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: var(--space-2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="meta-label">Step ${cp.step}</span>
            <span class="meta-value">BPC: ${cp.validation_bpc?.toFixed(2) || '—'}</span>
          </div>
          <div style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">${new Date(cp.timestamp).toLocaleString()}</div>
        </div>
      `).join('');
    } else {
      checkpointSelect.innerHTML = '<option value="">No checkpoints available</option>';
      checkpointSelect.disabled = true;
      genBtn.disabled = true;
      checkpointList.innerHTML = '<p class="empty-state">No checkpoints recorded for this experiment.</p>';
    }
  });

  // Generate sample from checkpoint
  document.getElementById('replay-generate')?.addEventListener('click', async () => {
    const expId = document.getElementById('replay-exp-select').value;
    const checkpointId = document.getElementById('replay-checkpoint-select').value;
    const outputEl = document.getElementById('replay-output');

    if (!expId || !checkpointId) return;

    outputEl.innerHTML = '<p class="empty-state">Loading checkpoint and generating sample...</p>';

    // In a real implementation, this would load the checkpoint and generate
    // For now, show a placeholder
    setTimeout(() => {
      document.getElementById('replay-output').innerHTML = `
        <p class="empty-state">Checkpoint replay requires model loading infrastructure.</p>
        <p style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted); margin-top: var(--space-2);">
          Checkpoint: ${document.getElementById('replay-checkpoint-select').value}<br>
          Experiment: ${document.getElementById('replay-exp-select').value}
        </p>
      `;
    }, 500);
  });
}

async function loadLearningCurves(data, expId) {
  const exp = data.experiments?.find(e => e.experiment_id === expId);
  if (!exp) return;

  const lossCanvas = document.getElementById('loss-canvas');
  const bpcCanvas = document.getElementById('bpc-canvas');
  const lossEmpty = document.getElementById('loss-empty');
  const bpcEmpty = document.getElementById('bpc-empty');

  const curve = exp.training?.trainingCurve;

  if (!curve || curve.length < 2) {
    if (lossEmpty) lossEmpty.style.display = 'flex';
    if (bpcEmpty) bpcEmpty.style.display = 'flex';
    return;
  }

  // Render loss curve
  renderCurve(lossCanvas, curve.map(p => ({ x: p.step, y: p.loss })), 'Loss', 'loss');
  if (document.getElementById('loss-empty')) lossEmpty.style.display = 'none';

  // Render BPC curve if validation data exists
  const valCurve = exp.training?.trainingCurve?.filter(p => p.validation_bpc !== undefined)
    .map(p => ({ x: p.step, y: p.validation_bpc }));

  if (valCurve && valCurve.length > 1) {
    renderCurve(document.getElementById('bpc-canvas'), valCurve.map(p => ({ x: p.x, y: p.y })), 'Validation BPC', 'bpc');
    if (document.getElementById('bpc-empty')) bpcEmpty.style.display = 'none';
  }
}

function renderCurve(canvas, points, label, type) {
  if (!canvas) return;

  canvas.style.display = 'block';
  const emptyEl = document.getElementById(`${type}-empty`);
  if (emptyEl) emptyEl.style.display = 'none';

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, rect.width, rect.height);

  const padding = 50;
  const chartWidth = rect.width - 2 * padding;
  const chartHeight = rect.height - 2 * padding;

  // Grid
  ctx.strokeStyle = '#E5E5E5';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = 50 + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(50 + chartWidth, y);
    ctx.stroke();
    const x = 50 + (chartWidth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x, 50 + chartHeight);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#101010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(50, 50 + chartHeight);
  ctx.lineTo(50 + chartWidth, 50 + chartHeight);
  ctx.stroke();

  // Data
  if (points.length < 2) return;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  ctx.beginPath();
  ctx.strokeStyle = '#101010';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  points.forEach((p, i) => {
    const x = 50 + ((p.x - minX) / (maxX - minX || 1)) * chartWidth;
    const y = 50 + chartHeight - ((p.y - minY) / (maxY - minY || 1)) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points
  points.forEach(p => {
    const x = 50 + ((p.x - minX) / (maxX - minX || 1)) * chartWidth;
    const y = 50 + chartHeight - ((p.y - minY) / (maxY - minY || 1)) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#101010';
    ctx.fill();
  });

  // Labels
  ctx.font = '11px "DM Mono", monospace';
  ctx.fillStyle = '#707070';
  ctx.textAlign = 'center';
  ctx.fillText('Step', canvas.width / 2, canvas.height - 10);
  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(label, 0, 0);
  ctx.restore();
}