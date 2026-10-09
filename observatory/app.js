/**
 * SEED Observatory — Main Application
 * Minimalist, data-driven interface for viewing SEED development.
 * No fake data, no simulated intelligence.
 */
import { renderOverview } from './views/overview.js';
import { renderEvolution } from './views/evolution.js';
import { renderArena } from './views/arena.js';
import { renderLearning } from './views/learning.js';
import { renderResearch } from './views/research.js';
import { renderModelLab } from './views/model-lab.js';
import { renderInteract } from './views/interact.js';
import { renderMemory } from './views/memory.js';
import { loadObservatoryData } from './data-loader.js';

// Global state
const state = {
  currentView: 'overview',
  observatoryData: null,
  currentModel: null,
};

// DOM elements
const views = {};
const navButtons = {};
const currentViewEl = document.getElementById('currentView');
const sidebar = document.querySelector('.sidebar');

// Initialize
async function init() {
  // Cache view elements
  document.querySelectorAll('.view').forEach(el => {
    views[el.id.replace('-view', '')] = el;
  });

  // Cache nav buttons
  document.querySelectorAll('.nav').forEach(btn => {
    navButtons[btn.dataset.view] = btn;
  });

  // Load observatory data
  try {
    state.observatoryData = await loadObservatoryData();
  } catch (error) {
    console.warn('Failed to load observatory data:', error);
    state.observatoryData = getDefaultData();
  }

  // Set up navigation
  setupNavigation();

  // Mobile sidebar toggle
  setupMobileSidebar();

  // Render initial view
  await switchView('overview');

  // Keyboard shortcuts
  setupKeyboardShortcuts();
}

function getDefaultData() {
  return {
    schema_version: 1,
    published_at: new Date().toISOString(),
    models: [
      { id: 'seed-0', status: 'implemented', architecture: 'seed0-context3-mlp', parameters: 6672, context_chars: 3, checkpoint_available: false }
    ],
    experiments: [],
    research_entries: [],
  };
}

function setupNavigation() {
  document.querySelectorAll('.nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      switchView(viewName);
    });
  });
}

function setupMobileSidebar() {
  // Create mobile menu button if needed
  if (window.innerWidth <= 768) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', 'Open navigation');
    menuBtn.style.cssText = 'position:fixed;top:16px;left:16px;z-index:200;padding:8px 12px;background:var(--ink);color:var(--canvas);border:none;border-radius:6px;font-size:20px;';
    document.body.appendChild(menuBtn);

    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on view change
    document.querySelectorAll('.nav').forEach(btn => {
      btn.addEventListener('click', () => sidebar.classList.remove('open'));
    });

    // Close on overlay click
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:99;display:none;';
    document.body.appendChild(overlay);

    sidebar.classList.contains('open') ? overlay.style.display = 'block' : overlay.style.display = 'none';
    sidebar.addEventListener('transitionend', () => {
      overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });
    overlay.addEventListener('click', () => sidebar.classList.remove('open'));
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const shortcuts = {
      '1': 'overview', '2': 'evolution', '3': 'arena',
      '4': 'learning', '5': 'research', '6': 'model-lab',
      '7': 'interact', '8': 'memory',
    };
    if (shortcuts[e.key]) {
      e.preventDefault();
      switchView(shortcuts[e.key]);
    }
    if (e.key === 'Escape') {
      sidebar.classList.remove('open');
    }
  });
}

async function switchView(viewName) {
  if (!views[viewName]) {
    console.warn(`View not found: ${viewName}`);
    return;
  }

  // Update nav buttons
  Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
  if (navButtons[viewName]) navButtons[viewName].classList.add('active');

  // Update views
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[viewName].classList.add('active');

  // Update current view indicator
  if (currentViewEl) currentViewEl.textContent = viewName.toUpperCase();

  // Update state
  state.currentView = viewName;

  // Close mobile sidebar
  sidebar.classList.remove('open');

  // Render view content
  try {
    await renderView(viewName);
  } catch (error) {
    console.error(`Failed to render ${viewName}:`, error);
    views[viewName].innerHTML = `<div class="empty-state">Failed to load view: ${error.message}</div>`;
  }
}

async function renderView(viewName) {
  const viewEl = views[viewName];
  const data = state.observatoryData;

  switch (viewName) {
    case 'overview':
      await renderOverview(viewEl, data);
      break;
    case 'evolution':
      await renderEvolution(viewEl, data);
      break;
    case 'arena':
      await renderArena(viewEl, data);
      break;
    case 'learning':
      await renderLearning(viewEl, data);
      break;
    case 'research':
      await renderResearch(viewEl, data);
      break;
    case 'model-lab':
      await renderModelLab(viewEl, data);
      break;
    case 'interact':
      await renderInteract(viewEl, data);
      break;
    case 'memory':
      await renderMemory(viewEl, data);
      break;
    default:
      viewEl.innerHTML = `<div class="empty-state">View not implemented: ${viewName}</div>`;
  }
}

// Export for manual navigation
window.switchView = switchView;
window.state = state;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}