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

      <div class="tab-main-layout" style="grid-template-columns: 1fr;">
        
        <!-- Questions List (Full Width) -->
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED &amp; YOUR EVALUATION
          </div>

          <div class="questions-list">
            ${questions.map((q, i) => {
    const why = whyFlow[i] || {};
    return `
                <div class="thread-card" style="margin-bottom: 2.5rem;">
                  <div class="thread-header">
                    <span class="thread-num">QUESTION ${i + 1}</span>
                    ${q.label ? `<span class="thread-label">${esc(q.label)}</span>` : ''}
                  </div>
                  <div class="thread-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
                    
                    <!-- Left: Question & Context -->
                    <div class="thread-left" style="padding: 1.5rem; border-right: 1px solid var(--border);">
                      <div class="question-text" style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1.25rem; color: var(--text);">${esc(q.shortened_question || q.question || '')}</div>
                      
                      <div class="q-context-section">
                        <div class="skills-assessed" style="margin-bottom: 1.25rem;">
                          ${(q.skills_to_be_assessed || []).map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}
                        </div>
                        
                        <div class="q-expanded-content-static" style="background: var(--surface-alt); padding: 1.25rem; border-radius: var(--radius-sm); border-left: 4px solid var(--primary);">
                          ${q.expected_answer_context ? `
                            <div class="section-label" style="font-size: 0.65rem; color: var(--primary); margin-bottom: 0.5rem; opacity: 0.8;">EXPECTED ANSWER CONTEXT</div>
                            <p class="context-p" style="font-size: 0.9rem; color: var(--text-mid); margin-bottom: 1.25rem; line-height: 1.6;">${esc(q.expected_answer_context)}</p>
                          ` : ''}
                          ${why.reasoning ? `
                            <div class="section-label" style="font-size: 0.65rem; color: var(--primary); margin-bottom: 0.5rem; opacity: 0.8;">WHY THIS QUESTION WAS CHOSEN</div>
                            <p class="context-p" style="font-size: 0.9rem; color: var(--text-mid); line-height: 1.6;">${esc(why.reasoning)}</p>
                          ` : ''}
                        </div>
                      </div>
                    </div>

                    <!-- Right: Evaluation Rubrics -->
                    <div class="thread-right" style="padding: 1.5rem; background: rgba(0,0,0,0.1);">
                      <div class="stage-section-label" style="margin-top: 0; margin-bottom: 1.25rem; font-size: 0.75rem; border-bottom: 2px solid var(--primary-border);">EVALUATION FOR Q${i + 1}</div>
                      <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${rubricPanel('QUESTION_TAILORING', `question_plan.questions.${i}.tailoring`)}
                        ${rubricPanel('QUESTION_CALIBRATION', `question_plan.questions.${i}.calibration`)}
                        ${rubricPanel('QUESTION_TONE', `question_plan.questions.${i}.tone`)}
                        ${rubricPanel('QUESTION_COVERAGE', `question_plan.questions.${i}.coverage`)}
                        ${rubricPanel('QUESTION_CONFIDENTIALITY', `question_plan.questions.${i}.confidentiality`)}
                      </div>
                    </div>

                  </div>
                </div>`;
  }).join('')}
          </div>
        </div>

      </div>
    </div>`;
}
