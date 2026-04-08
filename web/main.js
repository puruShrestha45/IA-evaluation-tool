// ═══════════════════════════════════════════════════════════════════════════
//  MAIN  — app init, events, render dispatch
// ═══════════════════════════════════════════════════════════════════════════

import { state }                    from './state.js';
import { api }                      from './api.js';
import { esc, getScore, setScore }  from './utils.js';
import { toggleGuide }              from './guide.js';
import { renderJDTab }              from './tab-jd.js';
import { renderResumeTab }          from './tab-resume.js';
import { renderQuestionsTab }       from './tab-questions.js';
import { renderDuringInterviewTab } from './tab-during.js';

// ── Render ────────────────────────────────────────────────────────────────

function renderContent() {
  const el = document.getElementById('content');
  const scrollY = window.scrollY;

  switch (state.tab) {
    case 'jd':        el.innerHTML = renderJDTab();              break;
    case 'resume':    el.innerHTML = renderResumeTab();          break;
    case 'questions': el.innerHTML = renderQuestionsTab();       break;
    case 'during':    el.innerHTML = renderDuringInterviewTab(); break;
  }

  window.scrollTo(0, scrollY);
}

function renderHeader() {
  const d = state.data;
  const parts = [d.interviewee_name, d.interviewer_name, d.job_name].filter(Boolean);
  document.getElementById('session-info').textContent = parts.join(' · ');
  document.getElementById('dataset-select').value = state.idx;
}

// ── Load ──────────────────────────────────────────────────────────────────

async function loadDataset(idx) {
  document.getElementById('content').innerHTML =
    '<div class="loading"><div class="spinner"></div>Loading dataset…</div>';

  state.idx  = idx;
  state.data = await api.getDataset(idx);
  state.ann  = await api.getAnnotations(idx) || {};

  renderHeader();
  renderContent();
}

// ── Save ──────────────────────────────────────────────────────────────────

function setSaveStatus(msg) {
  document.getElementById('save-status').textContent = msg;
}

function scheduleSave() {
  clearTimeout(state.saveTimer);
  setSaveStatus('saving…');
  state.saveTimer = setTimeout(async () => {
    await api.saveAnnotations(state.idx, state.ann);
    setSaveStatus('saved ✓');
    setTimeout(() => setSaveStatus(''), 2000);
  }, 700);
}

// ── Events ────────────────────────────────────────────────────────────────

function setupEvents() {
  // Sync details open state globally across all rubric-details with same id
  document.addEventListener('toggle', e => {
    if (e.target.matches('.rubric-details') && !e.target.dataset.handlingToggle) {
      const id = e.target.dataset.rubricId;
      const isOpen = e.target.open;
      document.querySelectorAll(`.rubric-details[data-rubric-id="${id}"]`).forEach(det => {
        if (det !== e.target && det.open !== isOpen) {
          det.dataset.handlingToggle = 'true';
          det.open = isOpen;
          setTimeout(() => delete det.dataset.handlingToggle, 10);
        }
      });
    }
  }, true);

  // Dataset selector
  document.getElementById('dataset-select').addEventListener('change', e => {
    loadDataset(parseInt(e.target.value));
  });

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderContent();
    });
  });

  // Score buttons, binary buttons, guide toggles — event delegation on #content
  const contentEl = document.getElementById('content');

  contentEl.addEventListener('click', e => {
    // Guide toggle buttons
    const guideBtn = e.target.closest('.guide-toggle-btn');
    if (guideBtn) { toggleGuide(guideBtn.dataset.guideToggle); return; }

    // Score buttons (1-5)
    const scoreBtn = e.target.closest('.score-btn');
    if (scoreBtn) {
      const container = scoreBtn.closest('[data-ann-key]');
      if (!container) return;
      const annKey = container.dataset.annKey;
      const value  = parseInt(scoreBtn.dataset.value);
      setScore(annKey, value);
      container.querySelectorAll('.score-btn').forEach(b => {
        b.classList.toggle('selected', parseInt(b.dataset.value) === value);
      });
      scheduleSave();
    }

    // Binary buttons (CORRECT / FAIL / YES / NO / GOOD / POOR)
    const binaryBtn = e.target.closest('.binary-btn, .inline-btn');
    if (binaryBtn) {
      const container = binaryBtn.closest('[data-ann-key]');
      if (!container) return;
      const annKey = container.dataset.annKey;
      const value  = binaryBtn.dataset.value;
      setScore(annKey, value);

      if (value === 'CORRECT' && container.dataset.classif) {
        setScore(annKey.replace('.correct', '.gt'), container.dataset.classif);
      }

      container.querySelectorAll('.binary-btn, .inline-btn').forEach(b => {
        b.classList.remove('selected', 'correct', 'fail');
        if (b.dataset.value === value) {
          const isPositive = ['CORRECT', 'YES', 'GOOD'].includes(value);
          b.classList.add('selected', isPositive ? 'correct' : 'fail');
        }
      });
      scheduleSave();
      // Conditionally-shown selects need a re-render when verdict changes
      if (['CORRECT', 'FAIL'].includes(value) &&
          (annKey.endsWith('.eval_correct') ||
           (annKey.startsWith('during_interview.classif.') && annKey.endsWith('.correct')))) {
        renderContent();
      }
    }
  });

  // Select dropdowns for ground-truth overrides
  contentEl.addEventListener('change', e => {
    const sel = e.target.closest('select[data-ann-key]');
    if (sel) {
      setScore(sel.dataset.annKey, sel.value);
      scheduleSave();
      if (sel.dataset.annKey.endsWith('.gt')) {
        renderContent();
      }
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  state.rubrics = await api.getRubrics();
  state.datasets = await api.getDatasets();

  const sel = document.getElementById('dataset-select');
  sel.innerHTML = state.datasets.map(d =>
    `<option value="${d.index}">${esc(d.candidate_name)} — ${esc(d.job_name)}</option>`
  ).join('');

  setupEvents();
  await loadDataset(0);
}

document.addEventListener('DOMContentLoaded', init);
