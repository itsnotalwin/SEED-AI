/**
 * SEED Observatory — Research Journal View
 * Chronological record of experiments, hypotheses, results, discoveries, and failures.
 */
export async function renderResearch(container, data) {
  if (!container) return;

  const entries = data.research_entries || [];
  const experiments = data.experiments || [];

  container.innerHTML = `
    <div class="panel">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb">OBSERVATORY <span class="slash">/</span> RESEARCH JOURNAL</span>
      </nav>

      <header class="section-header">
        <span class="kicker">LAB NOTEBOOK</span>
        <h2>Experiments, Hypotheses, Results & Failures</h2>
      </header>

      <p class="lede">Dated, sourced laboratory notes with hypotheses, pass/fail outcomes, and reproducibility details. Separate researcher-authored findings from SEED-generated research.</p>

      <div class="research-filters" style="margin-bottom: var(--space-4); display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;">
        <label style="font-family: var(--mono); font-size: 11px; color: var(--ink-muted);">Filter by source:</label>
        <button class="btn outline active" data-filter="all">All</button>
        <button class="btn outline" data-filter="human">Human-authored</button>
        <button class="btn outline" data-filter="seed">SEED-generated</button>
        <button class="btn outline" data-filter="experiment">Experiment records</button>
      </div>

      <div class="research-list" id="research-list" role="feed" aria-label="Research entries">
        <!-- Populated by JS -->
      </div>

      <div class="pagination" style="margin-top: var(--space-5); display: flex; justify-content: center; gap: var(--space-3);" id="research-pagination">
        <!-- Pagination controls -->
      </div>
    </div>
  `;

  initResearchView(data);
}

function initResearchView(data) {
  const entries = data.research_entries || [];
  const experiments = data.experiments || [];
  let currentFilter = 'all';
  let currentPage = 1;
  const itemsPerPage = 10;

  const listContainer = document.getElementById('research-list');
  const paginationContainer = document.getElementById('research-pagination');

  // Combine research entries and experiment records
  function getFilteredEntries() {
    const allEntries = [];

    // Add research entries
    entries.forEach(entry => {
      allEntries.push({
        ...entry,
        type: 'research',
        source: entry.author === 'SEED' ? 'seed' : 'human',
        date: entry.date,
        id: entry.id || `research-${entry.date}`,
      });
    });

    // Add experiment records as research entries
    experiments.forEach(exp => {
      allEntries.push({
        id: exp.experiment_id,
        date: exp.timestamp,
        type: 'experiment',
        source: 'experiment',
        title: `Experiment: ${exp.architecture_id}`,
        hypothesis: exp.hypothesis || 'Architecture comparison under controlled conditions',
        outcome: exp.status,
        metrics: {
          validation_bpc: exp.validation?.bitsPerCharacter,
          test_bpc: exp.test?.bitsPerCharacter,
          training_time: exp.training?.durationMs,
        },
        tags: [exp.architecture_id, exp.status, 'experiment'],
      });
    });

    // Filter by current filter
    let filtered = allEntries;
    if (currentFilter === 'human') {
      filtered = filtered.filter(e => e.source === 'human');
    } else if (currentFilter === 'seed') {
      filtered = filtered.filter(e => e.source === 'seed');
    } else if (currentFilter === 'experiment') {
      filtered = filtered.filter(e => e.type === 'experiment');
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }

  function renderList() {
    const container = document.getElementById('research-list');
    if (!container) return;

    const filtered = getFilteredEntries();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(filtered.length / 10);
    const start = (currentPage - 1) * 10;
    const pageItems = filtered.slice(start, start + 10);

    if (pageItems.length === 0) {
      document.getElementById('research-list').innerHTML = '<p class="empty-state">No research entries match the current filter.</p>';
      document.getElementById('research-pagination').innerHTML = '';
      return;
    }

    document.getElementById('research-list').innerHTML = pageItems.map(entry => {
      const dateStr = formatDate(entry.date);
      const sourceLabel = entry.source === 'human' ? 'HUMAN' : entry.source === 'seed' ? 'SEED' : 'EXPERIMENT';
      const sourceClass = entry.source === 'human' ? 'human' : entry.source === 'seed' ? 'seed' : 'experiment';

      return `
        <article class="research-card" data-id="${entry.id}">
          <header>
            <time class="research-date" datetime="${entry.date}">${formatDate(entry.date)}</time>
            <span class="research-tag ${sourceClass}">${sourceLabel}</span>
            <h3 class="research-hypothesis">${escapeHtml(entry.hypothesis || entry.title || 'Untitled')}</h3>
          </header>
          <div class="research-tags">
            ${(entry.tags || []).map(t => `<span class="research-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          ${entry.outcome ? `<div class="research-outcome">Outcome: <span class="outcome-${entry.outcome?.toLowerCase() || 'unknown'}">${escapeHtml(entry.outcome)}</span></div>` : ''}
          ${entry.metrics ? `
            <div class="research-outcome" style="margin-top: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--border);">
              <strong>Metrics:</strong>
              ${entry.metrics.validation_bpc !== undefined ? ` Val BPC: ${entry.metrics.validation_bpc.toFixed(2)}` : ''}
              ${entry.metrics.test_bpc !== undefined ? ` Test BPC: ${entry.metrics.test_bpc.toFixed(2)}` : ''}
              ${entry.metrics.training_time !== undefined ? ` Train: ${(entry.metrics.training_time / 60000).toFixed(1)} min` : ''}
            </div>
          ` : ''}
          ${entry.experiment_id ? `<div class="research-outcome">Experiment: <code>${escapeHtml(entry.experiment_id)}</code></div>` : ''}
        </article>
      `;
    }).join('');

    // Render pagination
    renderPagination();
  }

  function renderPagination() {
    const filtered = getFilteredEntries();
    const totalPages = Math.ceil(filtered.length / 10);
    const container = document.getElementById('research-pagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    if (currentPage > 1) {
      html += `<button class="btn outline" data-page="${currentPage - 1}" aria-label="Previous page">‹ Prev</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="btn ${i === currentPage ? 'primary' : 'outline'}" data-page="${i}" ${i === currentPage ? 'aria-current="page"' : ''}>${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span style="color: var(--ink-muted); padding: 0 var(--space-2);">…</span>`;
      }
    }
    if (currentPage < totalPages) {
      html += `<button class="btn outline" data-page="${currentPage + 1}" aria-label="Next page">Next ›</button>`;
    }
    document.getElementById('research-pagination').innerHTML = html;

    // Pagination handlers
    document.querySelectorAll('#research-pagination button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderList();
      });
    });
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

  // Filter handlers
  document.querySelectorAll('.research-filters .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.research-filters .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      renderList();
    });
  });

  // Initial render
  renderList();
}