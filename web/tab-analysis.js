// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Interview Analysis (Stage 11)
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, renderTabHeader } from './utils.js';

const RATING_CLS = {
  'Excellent':  'gt-e', 'Strong': 'gt-e',
  'Good':       'gt-g', 'Proficient': 'gt-g', 'Ready for next round': 'gt-g',
  'Adequate':   'gt-a', 'Developing': 'gt-i', 'Inadequate': 'gt-i',
  'Poor':       'gt-p', 'Limited': 'gt-p',    'Not recommended': 'gt-p',
};

function badge(label, score) {
  const cls = RATING_CLS[label] || 'gt-a';
  return `<span class="di-rubric-badge ${cls}">${esc(label || '—')}${score != null ? ` · ${score}/10` : ''}</span>`;
}

// Two-column wrapper: left = content, right = rubric annotation
function annotatedSection(contentHtml, rubricKey, annKey) {
  return `
    <div class="ia-annotated-row">
      <div class="ia-annotated-content">${contentHtml}</div>
      <div class="ia-annotated-rubric">${rubricPanel(rubricKey, annKey)}</div>
    </div>`;
}

export function renderAnalysisTab() {
  const d   = state.data;
  const out = (d.interview_analysis_data && d.interview_analysis_data.output) || d.interview_analysis || {};

  if (!out || !Object.keys(out).length) {
    return '<div class="empty-state">No interview analysis data found for this record.</div>';
  }

  const overall    = out.overall_score                      || {};
  const suitability = out.role_suitability                 || [];
  const skills      = out.skill_assessment                 || [];
  const summary     = out.performance_summary              || '';
  const discussion  = out.discussion_points_for_next_round || [];

  return `
    <div class="ia-tab">
      <div class="tab-main-layout">
        
        <!-- Left: Analysis Results -->
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED
          </div>

          <!-- Overall Hiring Recommendation -->
          <div class="ia-section card" style="margin-bottom: 1.5rem;">
            <div class="card-title">Overall Hiring Recommendation</div>
            <div class="ia-overall-banner">
              ${badge(overall.band, overall.score)}
              ${overall.summary ? `<p class="ia-overall-summary">${esc(overall.summary)}</p>` : ''}
            </div>
          </div>

          <!-- Performance Summary -->
          ${summary ? `
            <div class="ia-section card" style="margin-bottom: 1.5rem;">
              <div class="card-title">Performance Summary</div>
              <p class="ia-summary-text">${esc(summary)}</p>
            </div>
          ` : ''}

          <!-- Role Suitability -->
          ${suitability.length ? `
            <div class="ia-section card" style="margin-bottom: 1.5rem;">
              <div class="card-title">Role Suitability</div>
              <div class="ia-suitability-grid">
                ${suitability.map(s => `
                  <div class="ia-suitability-card">
                    <div class="ia-suitability-top">
                      <span class="ia-criterion">${esc(s.criterion || '')}</span>
                      ${badge(s.rating)}
                    </div>
                    <p class="ia-evidence">${esc(s.evidence || '')}</p>
                  </div>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Skill Assessment -->
          ${skills.length ? `
            <div class="ia-section card" style="margin-bottom: 1.5rem;">
              <div class="card-title">Skill Assessment</div>
              <div class="ia-skills-list">
                ${skills.map(sa => `
                  <div class="ia-skill-card">
                    <div class="ia-skill-header">
                      <span class="ia-skill-area">${esc(sa.skill_area || '')}</span>
                      ${badge(sa.band, sa.score)}
                    </div>
                    ${(sa.skills && sa.skills.length)
                      ? `<div class="ia-skill-tags">${sa.skills.map(sk => `<span class="skill-tag">${esc(sk)}</span>`).join('')}</div>`
                      : ''}
                    ${sa.summary ? `<p class="ia-skill-summary">${esc(sa.summary)}</p>` : ''}
                  </div>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Discussion Points -->
          ${discussion.length ? `
            <div class="ia-section card">
              <div class="card-title">Discussion Points for Next Round</div>
              <ol class="ia-discussion-list">
                ${discussion.map(dp => `
                  <li class="ia-discussion-item">
                    <div class="ia-discussion-topic">${esc(dp.topic || '')}</div>
                    ${dp.reasoning  ? `<div class="ia-discussion-row"><span class="ia-dl-label">Why</span><span class="ia-dl-text">${esc(dp.reasoning)}</span></div>`  : ''}
                    ${dp.focus_area ? `<div class="ia-discussion-row"><span class="ia-dl-label focus">Focus</span><span class="ia-dl-text">${esc(dp.focus_area)}</span></div>` : ''}
                  </li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>

        <!-- Right: Evaluations -->
        <div class="scores-column">
          ${renderTabHeader('YOUR EVALUATION', '🔍', 'analysis')}
          <div class="tab-side-scores">
            ${rubricPanel('IA_STRUCTURAL',  'interview_analysis.structural_integrity')}
            ${rubricPanel('IA_CALIBRATION', 'interview_analysis.score_calibration')}
            ${rubricPanel('IA_DISCUSSION',  'interview_analysis.discussion_quality')}
          </div>
        </div>

      </div>
    </div>`;
}
