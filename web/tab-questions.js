// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Interview Questions
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, scoreButtons, renderTabHeader } from './utils.js';

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
  const timeWarn = iqData.time_constraint_warning || '';

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

      <div class="tab-main-layout">
        
        <!-- Left: Questions -->
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED
          </div>

          <div class="questions-list">
            ${questions.map((q, i) => {
    const why = whyFlow[i] || {};
    return `
                <div class="thread-card">
                  <div class="thread-header">
                    <span class="thread-num">Q${i + 1}</span>
                    ${q.label ? `<span class="thread-label">${esc(q.label)}</span>` : ''}
                  </div>
                  <div class="thread-body" style="display: block; padding: 0.75rem 1.25rem 0 1.25rem;">
                    <div class="question-text" style="font-size: 0.9rem; margin-bottom: 0.75rem;">${esc(q.shortened_question || q.question || '')}</div>
                    
                    <details class="q-expansion">
                      <summary class="q-expansion-summary">
                        <div class="skills-assessed" style="margin-bottom: 0;">
                          ${(q.skills_to_be_assessed || []).map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}
                        </div>
                        <div class="expand-btn">View Context</div>
                      </summary>
                      
                      <div class="q-expanded-content">
                        ${q.expected_answer_context ? `
                          <div class="section-label">Expected answer context</div>
                          <p class="context-p">${esc(q.expected_answer_context)}</p>
                        ` : ''}
                        ${why.reasoning ? `
                          <div class="section-label" style="margin-top: 0.75rem;">Why this question was chosen</div>
                          <p class="context-p">${esc(why.reasoning)}</p>
                        ` : ''}
                      </div>
                    </details>
                  </div>
                </div>`;
  }).join('')}
          </div>
        </div>

        <!-- Right: Single Evaluation Sidebar -->
        <div class="scores-column">
          ${renderTabHeader('YOUR EVALUATION', '🔍', 'questions')}
          <div class="tab-side-scores">
            ${rubricPanel('QUESTION_TAILORING', 'question_plan.tailoring')}
            ${rubricPanel('QUESTION_CALIBRATION', 'question_plan.calibration')}
            ${rubricPanel('QUESTION_TONE', 'question_plan.tone')}
            ${rubricPanel('QUESTION_COVERAGE', 'question_plan.coverage')}
            ${rubricPanel('QUESTION_CONFIDENTIALITY', 'question_plan.confidentiality')}
          </div>
        </div>

      </div>
    </div>`;
}
