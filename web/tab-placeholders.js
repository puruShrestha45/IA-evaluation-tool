// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Placeholder tabs (data collection not yet implemented)
// ═══════════════════════════════════════════════════════════════════════════

function placeholderTab(title, stage, description) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;text-align:center;padding:2rem">
      <div style="font-size:2.5rem;margin-bottom:1rem;opacity:.4">🚧</div>
      <h2 style="font-size:1.1rem;font-weight:600;color:var(--text-main);margin:0 0 .4rem">${title}</h2>
      <p style="font-size:.82rem;color:var(--text-mid);margin:0 0 1rem;max-width:420px;line-height:1.55">${description}</p>
      <div style="display:inline-block;padding:.3rem .9rem;background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.75rem;color:var(--text-muted);font-weight:500">${stage}</div>
    </div>`;
}

export function renderTimekeeperTab() {
  return placeholderTab(
    'TimeKeeper',
    'Stage 9',
    'TimeKeeper message logs are not yet collected in the dataset. Once the data pipeline includes pacing alert outputs, annotations will appear here.',
  );
}

export function renderAnswerRelevancyTab() {
  return placeholderTab(
    'Answer Relevancy',
    'Stage 10',
    'Per-question answer relevancy scores are not yet collected in the dataset. This tab will display relevancy judgments once the data pipeline is extended.',
  );
}

export function renderAskIATab() {
  return placeholderTab(
    'Ask IA',
    'Stage 12',
    'Ask IA conversation logs are not yet included in the dataset export. Annotations for source grounding, scope enforcement, and response quality will appear here once collected.',
  );
}
