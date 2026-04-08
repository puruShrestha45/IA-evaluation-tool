// ═══════════════════════════════════════════════════════════════════════════
//  UTILS  — annotation helpers + shared render primitives
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { RUBRICS } from './rubrics.js';

// ── Annotation helpers ────────────────────────────────────────────────────

export function getScore(annKey) {
  return annKey.split('.').reduce((o, k) => o?.[k], state.ann);
}

export function setScore(annKey, value) {
  const keys = annKey.split('.');
  let cur = state.ann;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined || cur[keys[i]] === null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// ── HTML helpers ──────────────────────────────────────────────────────────

export function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function scoreButtons(annKey) {
  const current = getScore(annKey);
  return `
    <div class="score-buttons" data-ann-key="${annKey}">
      ${[1, 2, 3, 4, 5].map(n => `
        <button class="score-btn ${current === n ? 'selected' : ''}" data-value="${n}">${n}</button>
      `).join('')}
    </div>`;
}

export function rubricPanel(rubricKey, annKey) {
  const r = RUBRICS[rubricKey];
  if (!r) return '';
  return `
    <div class="rubric-panel ${r.veto ? 'veto' : ''}">
      <details>
        <summary class="rubric-summary">
          <span class="rubric-summary-left">
            ${r.veto ? '<span class="veto-badge">⚠ VETO</span>' : ''}
            ${esc(r.label)}
          </span>
          <span class="rubric-chevron">▶</span>
        </summary>
        <table class="rubric-table">
          ${Object.entries(r.scores).map(([s, desc]) => `
            <tr class="rubric-row-${s}">
              <td>${s}</td><td>${esc(desc)}</td>
            </tr>`).join('')}
        </table>
      </details>
      <div class="score-row">
        <span class="score-row-label">Score</span>
        ${scoreButtons(annKey)}
      </div>
    </div>`;
}

export function conversationHTML(detail) {
  if (!detail) return '<p class="muted">No transcript available.</p>';
  return detail.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(line => {
      const isR = line.startsWith('recruiter:');
      const isC = line.startsWith('candidate:');
      const cls = isR ? 'recruiter' : isC ? 'candidate' : 'other';
      const speaker = isR ? 'Recruiter' : isC ? 'Candidate' : '';
      const text = line.replace(/^(recruiter|candidate):/, '').trim();
      return `<div class="chat-line ${cls}">
        ${speaker ? `<span class="speaker">${speaker}</span>` : ''}
        <span class="chat-text">${esc(text)}</span>
      </div>`;
    }).join('');
}
