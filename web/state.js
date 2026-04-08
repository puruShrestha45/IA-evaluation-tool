// ═══════════════════════════════════════════════════════════════════════════
//  SHARED STATE  (single object — mutations visible to all importers)
// ═══════════════════════════════════════════════════════════════════════════

export const state = {
  datasets: [],
  idx: 0,
  data: null,
  ann: {},
  tab: 'during',
  saveTimer: null,
  rubrics: {},
};
