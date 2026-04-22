// ═══════════════════════════════════════════════════════════════════════════
//  UTILS  — annotation helpers + shared render primitives
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';

export const TAB_RUBRICS = {
  jd: ['jd_parsing.must_haves', 'jd_parsing.precision', 'jd_parsing.completeness'],
  resume: ['resume_parsing.chronological_fidelity', 'resume_parsing.informative_extraction', 'resume_parsing.identity_accuracy', 'resume_parsing.completeness'],
  questions: [],
  analysis: ['interview_analysis.structural_integrity', 'interview_analysis.score_calibration', 'interview_analysis.discussion_quality']
};
import { RUBRICS } from './rubrics.js';

export function scoreButtons(annKey, max = 10) {
  const current = getScore(annKey) || 0;
  let h = '';
  for (let i = 1; i <= max; i++) {
    h += `<button class="score-btn ${current === i ? 'selected' : ''}" data-value="${i}">${i}</button>`;
  }
  return `<div class="score-group" data-ann-key="${annKey}">${h}</div>`;
}

// ── Annotation helpers ────────────────────────────────────────────────────

export function getScore(annKey) {
  return annKey.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, state.ann);
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
  return String(str != null ? str : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function scoreStars(annKey, rubricId) {
  const current = getScore(annKey);
  return `
    <div class="star-rating" data-ann-key="${annKey}" data-rubric-id="${rubricId}">
      ${[1, 2, 3, 4, 5].map(n => `
        <span class="star ${current >= n ? 'selected' : ''}" data-value="${n}">★</span>
      `).join('')}
    </div>`;
}

export function rubricPanel(rubricKey, annKey) {
  const r = RUBRICS[rubricKey];
  if (!r) return '';
  
  const currentScore = getScore(annKey);
  const currentDimensions = getScore(`${annKey}_dims`) || [];
  const dimId = r.dimensionId || '';
  
  return `
    <div class="rubric-panel ${r.veto ? 'veto' : ''}" data-rubric-id="${rubricKey}">
      <div class="rubric-header">
         <div class="dimension-label">DIMENSION ${dimId}</div>
         <div class="rubric-question">${esc(r.question || r.label)}</div>
         <div class="rubric-reasoning">Why we ask: ${esc(r.reasoning || '')}</div>
      </div>

      <div class="rubric-main">
        <div class="rubric-left">
           ${scoreStars(annKey, rubricKey)}
           
           <div class="dimensions-container" id="dims-${rubricKey}" style="display: ${currentScore ? 'block' : 'none'}">
             <div class="dims-title">${currentScore <= 2 ? 'What went wrong?' : 'Details'} <span class="muted" style="font-size:0.65rem; font-weight:normal; text-transform:none; margin-left:4px;">(Select all that apply)</span></div>
             <div class="dims-list">
               ${((r.dimensions && r.dimensions[currentScore]) || []).map(opt => `
                 <label class="dim-checkbox">
                   <input type="checkbox" data-ann-key="${annKey}_dims" value="${esc(opt)}" ${currentDimensions.includes(opt) ? 'checked' : ''}>
                   <span>${esc(opt)}</span>
                 </label>
               `).join('')}
             </div>
           </div>
        </div>

        <div class="rubric-right">
           <div class="rubric-static-list" id="desc-list-${rubricKey}">
             ${[5, 4, 3, 2, 1].map(n => `
               <div class="rubric-level ${currentScore === n ? 'active' : ''}" data-level="${n}">
                 <span class="level-stars">${n}★</span>
                 <span class="level-desc">${esc(r.scores[n])}</span>
               </div>
             `).join('')}
           </div>
        </div>
      </div>
    </div>`;
}

export function conversationHTML(detail) {
  if (!detail) return '<p class="muted">No transcript available.</p>';
  return `<div class="conversation-scroll">` +
    detail.split('\n')
      .map(l => l.trim()).filter(Boolean)
      .map(line => {
        const isR = line.startsWith('recruiter:');
        const isC = line.startsWith('candidate:');
        const cls = isR ? 'recruiter' : isC ? 'candidate' : 'other';
        const speaker = isR ? 'Recruiter' : (isC ? 'Candidate' : '');
        const text = line.replace(/^(recruiter|candidate):/, '').trim();
        return `<div class="chat-line ${cls}">
          ${speaker ? `<span class="speaker">${speaker}</span>` : ''}
          <span class="chat-text">${esc(text)}</span>
        </div>`;
      }).join('') + `</div>`;
}

export function renderTabHeader(label, icon, tabId) {
  return `
    <div class="tab-header-label">
      <span class="icon">${icon}</span>
      ${label}
    </div>`;
}
