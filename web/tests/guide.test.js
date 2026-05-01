// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../utils.js', () => ({
  esc: (s) => String(s ?? ''),
}))

import { loadHiddenGuides, toggleGuide } from '../guide.js'

const GUIDE_KEY = 'ia_eval_hidden_guides'

describe('loadHiddenGuides', () => {
  beforeEach(() => localStorage.clear())

  it('should return an empty Set when nothing is stored', () => {
    const result = loadHiddenGuides()
    expect(result instanceof Set).toBe(true)
    expect(result.size).toBe(0)
  })

  it('should return stored guide types as a Set', () => {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(['jd', 'resume']))
    const result = loadHiddenGuides()
    expect(result.has('jd')).toBe(true)
    expect(result.has('resume')).toBe(true)
  })

  it('should return an empty Set when stored value is invalid JSON', () => {
    localStorage.setItem(GUIDE_KEY, 'not-valid-json')
    expect(loadHiddenGuides().size).toBe(0)
  })
})

describe('toggleGuide', () => {
  beforeEach(() => localStorage.clear())

  it('should add a guide type to the hidden set when it was not hidden', () => {
    toggleGuide('jd')
    expect(loadHiddenGuides().has('jd')).toBe(true)
  })

  it('should remove a guide type from the hidden set when it was already hidden', () => {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(['jd']))
    toggleGuide('jd')
    expect(loadHiddenGuides().has('jd')).toBe(false)
  })

  it('should persist the toggled state to localStorage', () => {
    toggleGuide('resume')
    const stored = JSON.parse(localStorage.getItem(GUIDE_KEY))
    expect(stored).toContain('resume')
  })
})
