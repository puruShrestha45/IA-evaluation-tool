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
import { renderDuringInterviewTab, buildDisplayOrder } from './tab-during.js';
import { renderAnalysisTab }                          from './tab-analysis.js';
import { renderTimekeeperTab, renderAnswerRelevancyTab, renderAskIATab } from './tab-placeholders.js';

// --- LOGIN LOGIC ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('login-btn');
const loginEmailInput = document.getElementById('login-email');
const userDisplayEmail = document.getElementById('user-display-email');
const logoutBtn = document.getElementById('logout-btn');

// --- Helpers ---
function updateIdentityUI(email) {
  if (email) {
    userDisplayEmail.textContent = `| 👤 ${email}`;
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  }
}

// ── Render ────────────────────────────────────────────────────────────────

function renderContent() {
  const el = document.getElementById('content');
  const scrollY = window.scrollY;

  try {
    switch (state.tab) {
      case 'jd':               el.innerHTML = renderJDTab();               break;
      case 'resume':           el.innerHTML = renderResumeTab();           break;
      case 'questions':        el.innerHTML = renderQuestionsTab();        break;
      case 'during':           el.innerHTML = renderDuringInterviewTab();  break;
      case 'analysis':         el.innerHTML = renderAnalysisTab();         break;
      case 'timekeeper':       el.innerHTML = renderTimekeeperTab();       break;
      case 'answer-relevancy': el.innerHTML = renderAnswerRelevancyTab();  break;
      case 'ask-ia':           el.innerHTML = renderAskIATab();            break;
    }
  } catch (err) {
    console.error('Render error in tab', state.tab, err);
    el.innerHTML = `<div class="error-msg" style="padding:1.5rem;color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;margin:1rem;">
      <strong>Render error (${state.tab} tab):</strong> ${esc(err.message)}
      <pre style="font-size:.75rem;margin-top:.5rem;overflow:auto;">${esc(err.stack || '')}</pre>
    </div>`;
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

  // Logout Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm("Logout? Ensure your work is saved.")) {
        localStorage.removeItem('eval_user_email');
        window.location.reload();
      }
    });
  }

  // Score buttons, binary buttons, guide toggles — event delegation on #content
  const contentEl = document.getElementById('content');

  contentEl.addEventListener('click', e => {
    // Guide toggle buttons
    const guideBtn = e.target.closest('.guide-toggle-btn');
    if (guideBtn) { toggleGuide(guideBtn.dataset.guideToggle); return; }

    // Bulk "Mark remaining as Correct" after confirmed Interview End
    const markRemainingBtn = e.target.closest('.mark-remaining-btn');
    if (markRemainingBtn) {
      const startCi = parseInt(markRemainingBtn.dataset.startCi);
      const pit = state.data.processed_interview_transcript;
      const ordered = buildDisplayOrder(pit);
      let ci = 0;
      for (const entry of ordered) {
        if (entry.role === 'system' && entry.task === 'classification') {
          if (ci >= startCi) {
            const ab6    = `flow_classification.c${ci}`;
            const classif = entry.output?.classification || '';
            setScore(`${ab6}.classification`, 'CORRECT');
            setScore(`${ab6}.ground_truth`, classif);
          }
          ci++;
        }
      }
      scheduleSave();
      renderContent();
      return;
    }

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
        setScore(annKey.replace('.classification', '.ground_truth'), container.dataset.classif);
      }

      container.querySelectorAll('.binary-btn, .inline-btn').forEach(b => {
        b.classList.remove('selected', 'correct', 'fail');
        if (b.dataset.value === value) {
          const isPositive = ['CORRECT', 'YES', 'GOOD'].includes(value);
          b.classList.add('selected', isPositive ? 'correct' : 'fail');
        }
      });
      scheduleSave();
      // Re-render when classification verdict changes (controls ground-truth select + flow metrics)
      if (['CORRECT', 'FAIL'].includes(value) &&
          annKey.startsWith('flow_classification.c') && annKey.endsWith('.classification')) {
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
      if (sel.dataset.annKey.endsWith('.ground_truth')) {
        renderContent();
      }
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  // 1. Check if user is already logged in
  const savedEmail = localStorage.getItem('eval_user_email');

  if (savedEmail) {
    // If logged in, hide screen and start app
    loginScreen.style.display = 'none';
    updateIdentityUI(savedEmail);
    await startApp(); 
  } else {
    // If not logged in, wait for the button click
    loginBtn.addEventListener('click', async () => {
      const email = loginEmailInput.value.trim().toLowerCase();
      if (email && email.includes('@')) {
        localStorage.setItem('eval_user_email', email);
        loginScreen.style.display = 'none';
        updateIdentityUI(email);
        await startApp(); // Now start the data loading
      } else {
        alert("Please enter a valid work email.");
      }
    });

    //Enter key
    loginEmailInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') loginBtn.click();
    })
  }
}

async function startApp() {
  try{
    state.rubrics = await api.getRubrics();
    state.datasets = await api.getDatasets();

    const sel = document.getElementById('dataset-select');
    sel.innerHTML = state.datasets.map(d =>
      `<option value="${d.index}">${esc(d.candidate_name)} — ${esc(d.job_name)}</option>`
    ).join('');

    setupEvents();
    await loadDataset(0);
  } catch (err) {
    console.error("Failed to initialize app:", err);
    document.getElementById('content').innerHTML = `
        <div class="error-msg">
          <h3>Connection Error</h3>
          <p>Could not reach the server. Please check your connection and refresh.</p>
        </div>
      `;
  }
}

document.addEventListener('DOMContentLoaded', init);
