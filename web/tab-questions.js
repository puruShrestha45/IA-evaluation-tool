// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Interview Questions
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, scoreButtons } from './utils.js';

export function renderQuestionsTab() {
  const d = state.data;
  const iqData = d.initial_questions?.[0];

  if (!iqData) {
    return '<div class="empty-state">No interview question plan found for this record.</div>';
  }

  const questions   = iqData.questions   || [];
  const whyFlow     = iqData.why_this_flow || [];
  const coverage    = iqData.skill_coverage || {};
  const summary     = iqData.why_this_flow_summary || '';
  const timeWarn    = iqData.time_constraint_warning || '';

  const coveredSkills   = coverage.skills_covered   || [];
  const uncoveredSkills = (coverage.total_skills || []).filter(s => !coveredSkills.includes(s));

  let html = `
    <div class="iq-strategy-card card">
      <div class="card-title">Interview Question Strategy</div>
      ${summary ? `<p class="iq-summary">${esc(summary)}</p>` : ''}
      ${timeWarn ? `<div class="alert alert-warn" style="margin-top:.6rem">${esc(timeWarn)}</div>` : ''}
      <div class="iq-coverage">
        ${coveredSkills.length ? `<div class="iq-coverage-row">
          <span class="iq-coverage-label">Covered</span>
          ${coveredSkills.map(s => `<span class="skill-tag covered">${esc(s)}</span>`).join('')}
        </div>` : ''}
        ${uncoveredSkills.length ? `<div class="iq-coverage-row">
          <span class="iq-coverage-label muted">Not covered</span>
          ${uncoveredSkills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>`;

  html += questions.map((q, i) => {
    const why = whyFlow[i] || {};
    const annBase = `questions.plan.${i}`;
    return `
      <div class="thread-card">
        <div class="thread-header">
          <span class="thread-num">Q${i + 1}</span>
          ${q.label  ? `<span class="thread-label">${esc(q.label)}</span>`  : ''}
          ${q.time   ? `<span class="thread-time">⏱ ${q.time} min</span>`  : ''}
        </div>
        <div class="thread-body">
          <div class="thread-left">
            <div>
              <div class="section-label">Question</div>
              <div class="question-text">${esc(q.question || '')}</div>
              ${q.skills_to_be_assessed?.length
                ? `<div class="skills-assessed">${q.skills_to_be_assessed.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div>`
                : ''}
              ${q.expected_answer_context
                ? `<details class="expected-answer">
                     <summary>Expected answer context</summary>
                     <p>${esc(q.expected_answer_context)}</p>
                   </details>`
                : ''}
              ${why.reasoning
                ? `<details class="expected-answer">
                     <summary>Why this question was chosen</summary>
                     <p>${esc(why.reasoning)}</p>
                   </details>`
                : ''}
            </div>
          </div>
          <div class="thread-right">
            <h4>Rate this question</h4>
            ${rubricPanel('QUESTION_FIT', `${annBase}.question_fit`)}
            ${rubricPanel('FAIRNESS',     `${annBase}.fairness`)}
          </div>
        </div>
      </div>`;
  }).join('');

  html += `
    <div class="session-coherence">
      <h3>Overall Question Set Coherence</h3>
      <p>Does the set of questions form a logical, complete interview for this role and candidate?</p>
      <div class="score-row" style="padding:0;margin-top:.5rem">
        <span class="score-row-label">Score</span>
        ${scoreButtons('questions.coherence')}
      </div>
    </div>`;

  return html;
}
