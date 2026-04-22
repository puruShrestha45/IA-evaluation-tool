// ═══════════════════════════════════════════════════════════════════════════
//  MAIN  — app init, events, render dispatch
// ═══════════════════════════════════════════════════════════════════════════

import { state }                    from './state.js';
import { api }                      from './api.js';
import { esc, getScore, setScore, TAB_RUBRICS }  from './utils.js';
import { toggleGuide }              from './guide.js';
import { renderJDTab }              from './tab-jd.js';
import { renderResumeTab }          from './tab-resume.js';
import { renderQuestionsTab }       from './tab-questions.js';
import { renderDuringInterviewTab, buildDisplayOrder } from './tab-during.js';
import { renderAnalysisTab }                          from './tab-analysis.js';
import { renderTimekeeperTab, renderAnswerRelevancyTab, renderAskIATab } from './tab-placeholders.js';
import { RUBRICS }                  from './rubrics.js';

// --- Helpers ---
function updateIdentityUI(email) {
  const userDisplayEmail = document.getElementById('user-display-email');
  const logoutBtn = document.getElementById('logout-btn');
  const resetBtn = document.getElementById('reset-evals-btn');
  if (email && userDisplayEmail) {
    userDisplayEmail.textContent = `| 👤 ${email}`;
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (resetBtn) resetBtn.style.display = 'inline-block';
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
  updateProgress();
}

function updateProgress() {
  let totalDone = 0;
  let totalAll = 0;

  for (const [tabId, keys] of Object.entries(TAB_RUBRICS)) {
    let done = keys.filter(k => getScore(k)).length;
    let all = keys.length;

    // Dynamically add per-question rubrics for the Questions tab
    if (tabId === 'questions' && state.data && state.data.initial_questions && state.data.initial_questions[0]) {
      const questions = state.data.initial_questions[0].questions || [];
      questions.forEach((_, i) => {
        ['tailoring', 'calibration', 'tone', 'coverage', 'confidentiality'].forEach(subKey => {
          all++;
          if (getScore(`question_plan.questions.${i}.${subKey}`)) done++;
        });
      });
    }

    totalDone += done;
    totalAll += all;

    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (tabBtn) {
      const label = tabBtn.textContent.split(' (')[0];
      tabBtn.textContent = `${label} (${done}/${all})`;
    }
  }

  const overallBar = document.getElementById('overall-progress-bar');
  if (overallBar) {
    const pct = totalAll > 0 ? (totalDone / totalAll) * 100 : 0;
    overallBar.style.width = `${pct}%`;
  }

  // Also update the individual tab header count if we've rendered the current tab
  // (though the tab renders themselves call updateProgress via renderContent usually)
}

function renderHeader() {
  const d = state.data;
  const parts = [d.interviewee_name, d.interviewer_name, d.job_name].filter(Boolean);
  document.getElementById('session-info').textContent = parts.join(' · ');
  document.getElementById('dataset-select').value = state.idx;
}

// ── Load ──────────────────────────────────────────────────────────────────

async function loadDataset(idx) {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading dataset…</div>';
  }

  state.idx  = idx;
  state.idx  = idx;
  const fetchedData = await api.getDataset(idx).catch(e => {
    console.error("Failed to fetch dataset:", e);
    return {};
  });
  state.data = fetchedData || {};
  const annFetched = await api.getAnnotations(idx);
  state.ann  = (annFetched && typeof annFetched === 'object') ? annFetched : {};

  renderHeader();
  renderContent();
  
  // Force an initial save to create the database row immediately upon login/load
  scheduleSave();
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

  document.addEventListener('toggle', (e) => {
  // Check if the toggled element is a rubric details box
    if (e.target.matches('.rubric-details')) {
      const container = document.getElementById('eval-container');
      const box = e.target.closest('.eval-box');
      
      if (!container || !box) return;

      if (e.target.open) {
        // 1. Close other boxes so only one is "Featured"
        container.querySelectorAll('.rubric-details').forEach(d => {
          if (d !== e.target) d.open = false;
        });

        // 2. Apply classes to trigger the CSS Grid reflow
        container.classList.add('has-expanded');
        container.querySelectorAll('.eval-box').forEach(b => b.classList.remove('is-expanded'));
        box.classList.add('is-expanded');
      } else {
        // 3. Back to 2x2 if all are closed
        container.classList.remove('has-expanded');
        box.classList.remove('is-expanded');
      }
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
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm("Logout? Ensure your work is saved.")) {
        localStorage.removeItem('eval_user_email');
        window.location.reload();
      }
    });
  }

  // Reset Evals Button
  const resetBtn = document.getElementById('reset-evals-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm("🚨 WARNING 🚨\n\nAre you absolutely sure you want to reset all evaluations for this candidate? All your progress will be permanently lost and reset from scratch. This action cannot be undone.\n\nType 'OK' (or click OK) to confirm.")) {
        setSaveStatus('resetting…');
        const res = await api.resetAnnotations(state.idx);
        if (res.ok) {
          state.ann = {};
          renderContent();
          setSaveStatus('reset ✓');
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          setSaveStatus('reset failed');
          setTimeout(() => setSaveStatus(''), 2000);
        }
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
            const classif = (entry.output && entry.output.classification) || '';
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

    // Star rating click
    const star = e.target.closest('.star');
    if (star) {
      const container = star.closest('.star-rating');
      const rubricId = container.dataset.rubricId;
      const annKey = container.dataset.annKey;
      const value = parseInt(star.dataset.value);
      const r = RUBRICS[rubricId];

      setScore(annKey, value);
      
      // Update star UI
      container.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('selected', parseInt(s.dataset.value) <= value);
      });

      // Update Rubric Description Highlights
      const listEl = document.getElementById(`desc-list-${rubricId}`);
      if (listEl) {
        listEl.querySelectorAll('.rubric-level').forEach(lvl => {
          lvl.classList.toggle('active', parseInt(lvl.dataset.level) === value);
        });
      }

      // Update Dimensions (Checkboxes)
      const dimsEl = document.getElementById(`dims-${rubricId}`);
      if (dimsEl && r) {
        dimsEl.style.display = 'block';
        const titleEl = dimsEl.querySelector('.dims-title');
        if (titleEl) titleEl.innerHTML = `${value <= 2 ? 'What went wrong?' : 'Details'} <span class="muted" style="font-size:0.65rem; font-weight:normal; text-transform:none; margin-left:4px;">(Select all that apply)</span>`;
        
        const dimsList = dimsEl.querySelector('.dims-list');
        const currentDims = getScore(`${annKey}_dims`) || [];
        dimsList.innerHTML = ((r.dimensions && r.dimensions[value]) || []).map(opt => `
          <label class="dim-checkbox">
            <input type="checkbox" data-ann-key="${annKey}_dims" value="${esc(opt)}" ${currentDims.includes(opt) ? 'checked' : ''}>
            <span>${esc(opt)}</span>
          </label>
        `).join('');
      }

      scheduleSave();
      updateProgress();
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

  contentEl.addEventListener('mouseover', e => {
    const star = e.target.closest('.star');
    if (star) {
      const container = star.closest('.star-rating');
      const rubricId = container.dataset.rubricId;
      const value = parseInt(star.dataset.value);
      
      // Color all stars up to the hovered one
      container.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('hovered', parseInt(s.dataset.value) <= value);
      });

      const listEl = document.getElementById(`desc-list-${rubricId}`);
      if (listEl) {
        listEl.querySelectorAll('.rubric-level').forEach(lvl => {
          lvl.classList.toggle('hover', parseInt(lvl.dataset.level) === value);
        });
      }
    }
  });

  contentEl.addEventListener('mouseout', e => {
    const star = e.target.closest('.star');
    if (star) {
      const container = star.closest('.star-rating');
      const rubricId = container.dataset.rubricId;
      
      // Remove hovered class from all stars
      container.querySelectorAll('.star').forEach(s => {
        s.classList.remove('hovered');
      });

      const listEl = document.getElementById(`desc-list-${rubricId}`);
      if (listEl) {
        listEl.querySelectorAll('.rubric-level').forEach(lvl => {
          lvl.classList.remove('hover');
        });
      }
    }
  });

  // Handle Dimension Checkboxes (Multi-select)
  contentEl.addEventListener('change', e => {
    if (e.target.matches('.dim-checkbox input')) {
      const annKey = e.target.dataset.annKey;
      const value = e.target.value;
      const current = getScore(annKey) || [];
      
      if (e.target.checked) {
        if (!current.includes(value)) current.push(value);
      } else {
        const idx = current.indexOf(value);
        if (idx > -1) current.splice(idx, 1);
      }
      
      setScore(annKey, current);
      scheduleSave();
    }

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
  const loginScreen = document.getElementById('login-screen');
  const loginBtn = document.getElementById('login-btn');
  const loginEmailInput = document.getElementById('login-email');

  // 1. Check if user is already logged in
  const savedEmail = localStorage.getItem('eval_user_email');

  if (savedEmail) {
    if (loginScreen) loginScreen.style.display = 'none';
    updateIdentityUI(savedEmail);
    await startApp(); 
  } else if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = loginEmailInput ? loginEmailInput.value.trim().toLowerCase() : '';
      if (email && email.includes('@')) {
        localStorage.setItem('eval_user_email', email);
        if (loginScreen) loginScreen.style.display = 'none';
        updateIdentityUI(email);
        await startApp();
      } else {
        alert("Please enter a valid work email.");
      }
    });

    if (loginEmailInput) {
      loginEmailInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') loginBtn.click();
      });
    }
  }
}

async function startApp() {
  const content = document.getElementById('content');
  try{
    state.datasets = await api.getDatasets();
    try {
      state.rubrics = await api.getRubrics() || {};
    } catch (e) {}

    const sel = document.getElementById('dataset-select');
    if (sel) {
      sel.innerHTML = state.datasets.map(d =>
        `<option value="${d.index}">${esc(d.candidate_name)} — ${esc(d.job_name)}</option>`
      ).join('');
    }

    setupEvents();
    await loadDataset(0);
  } catch (err) {
    console.error("Failed to initialize app:", err);
    if (content) {
      content.innerHTML = `<div class="error-msg"><h3>Connection Error</h3><p>Could not reach the server.</p></div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
