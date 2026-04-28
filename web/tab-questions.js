// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Interview Questions
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel, renderTabHeader, feedbackBox } from './utils.js';

const DIMS = [
  { key: 'QUESTION_RELEVANCE', ann: 'relevance', label: 'Relevance' },
  { key: 'QUESTION_TAILORING', ann: 'tailoring', label: 'Tailoring' },
  { key: 'QUESTION_CLARITY',   ann: 'clarity',   label: 'Clarity'   },
  { key: 'QUESTION_RATIONALE', ann: 'rationale', label: 'Rationale' },
  { key: 'QUESTION_EXPECTED',  ann: 'expected',  label: 'Expected'  },
];

export function renderQuestionsTab() {
  const d = state.data;
  const iqData = d.initial_questions && d.initial_questions[0];

  if (!iqData) {
    return '<div class="empty-state">No interview question plan found for this record.</div>';
  }

  const questions = iqData.questions || [];
  const whyFlow = iqData.why_this_flow || [];
  const coverage = iqData.skill_coverage || {};
  const summary = iqData.why_this_flow_summary || '';

  const coveredSkills = coverage.skills_covered || [];
  const uncoveredSkills = (coverage.total_skills || []).filter(s => !coveredSkills.includes(s));

  return `
    <div class="questions-tab">

      <div class="iq-strategy-card card" style="margin-bottom: 2rem;">
        <div class="card-title">Interview Question Strategy</div>
        ${summary ? `<p class="iq-summary">${esc(summary)}</p>` : ''}
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
      </div>

      <div class="tab-main-layout" style="grid-template-columns: 1fr;">
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED &amp; YOUR EVALUATION
          </div>

          <div class="questions-list">
            ${questions.map((q, i) => {
              const why = whyFlow[i] || {};
              const annBase = `question_plan.questions.${i}`;

              const scoredCount = DIMS.filter(dim => !!getScore(`${annBase}.${dim.ann}`)).length;
              const progressState = scoredCount === 0 ? 'untouched' : scoredCount === DIMS.length ? 'complete' : 'partial';
              const progressPct = (scoredCount / DIMS.length) * 100;

              const tabStrip = DIMS.map((dim, j) => {
                const scored = !!getScore(`${annBase}.${dim.ann}`);
                return `<button class="dim-tab-btn ${j === 0 ? 'active' : ''}" data-q="${i}" data-dim="${j}">
                  ${dim.label}
                  <span class="dim-scored-dot ${scored ? 'scored' : ''}"></span>
                </button>`;
              }).join('');

              const panels = DIMS.map((dim, j) => `
                <div class="dim-panel ${j === 0 ? '' : 'hidden'}" data-q="${i}" data-dim="${j}">
                  ${rubricPanel(dim.key, `${annBase}.${dim.ann}`)}
                </div>`).join('');

              return `
                <div class="thread-card" data-progress="${progressState}" style="margin-bottom: 2.5rem;">
                  <div class="thread-header">
                    <span class="thread-num">QUESTION ${i + 1}</span>
                    <div class="q-progress-wrap">
                      <span class="q-progress-text">${scoredCount}/${DIMS.length} rated</span>
                      <div class="q-progress-track">
                        <div class="q-progress-fill" style="width: ${progressPct}%"></div>
                      </div>
                    </div>
                  </div>
                  <div class="thread-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">

                    <!-- Left: Question & Context -->
                    <div class="thread-left" style="padding: 1.5rem; border-right: 1px solid var(--border);">
                      <div class="question-text" style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text);">${esc(q.shortened_question || q.question || '')}</div>

                      <div class="q-context-section">

                        <div class="q-sub-box" style="border-left-color: var(--s2);">
                          <div class="q-sub-box-label" style="color: var(--s2);">WHY THIS QUESTION WAS ASKED</div>
                          ${why.reasoning
                            ? `<p class="context-p">${esc(why.reasoning)}</p>`
                            : '<p class="context-p muted" style="font-style:italic">Not provided</p>'}
                        </div>

                        <div class="q-sub-box" style="border-left-color: var(--primary);">
                          <div class="q-sub-box-label" style="color: var(--primary);">SKILLS AND AREAS ASSESSED</div>
                          <div class="skills-assessed">
                            ${(q.skills_to_be_assessed || []).length
                              ? (q.skills_to_be_assessed).map(s => `<span class="jd-chip jd-chip-must">${esc(s)}</span>`).join('')
                              : '<span class="muted" style="font-size:.8rem;font-style:italic">None listed</span>'}
                          </div>
                        </div>

                        <div class="q-sub-box" style="border-left-color: var(--s4);">
                          <div class="q-sub-box-label" style="color: var(--s4);">EXPECTED ANSWER CONTEXT</div>
                          ${q.expected_answer_context
                            ? `<p class="context-p">${esc(q.expected_answer_context)}</p>`
                            : '<p class="context-p muted" style="font-style:italic">Not provided</p>'}
                        </div>

                      </div>
                    </div>

                    <!-- Right: Tabbed Evaluation Rubrics -->
                    <div class="thread-right dim-tabs-container">
                      <div class="dim-tab-strip">${tabStrip}</div>
                      <div class="dim-panels-body">${panels}</div>
                      ${feedbackBox(`${annBase}.feedback`)}
                    </div>

                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
}
