import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../state.js', () => ({
  state: { ann: {} },
}))

vi.mock('../rubrics.js', () => ({
  RUBRICS: {
    TEST_KEY: {
      question: 'Did the AI handle this correctly?',
      reasoning: 'Correctness determines downstream quality.',
      dimensionId: '7.1',
      veto: false,
      scores: { 1: 'Poor', 2: 'Inadequate', 3: 'Adequate', 4: 'Good', 5: 'Excellent' },
      dimensions: { 3: ['Issue A'], 2: ['Issue B', 'Issue C'] },
    },
  },
}))

import { getScore, setScore, esc, TAB_RUBRICS } from '../utils.js'
import { state } from '../state.js'

describe('getScore', () => {
  beforeEach(() => { state.ann = {} })

  it('should return undefined when key path does not exist', () => {
    expect(getScore('a.b')).toBeUndefined()
  })

  it('should return value at a single-level key', () => {
    state.ann = { score: 3 }
    expect(getScore('score')).toBe(3)
  })

  it('should return value at a nested dot-notation path', () => {
    state.ann = { jd_parsing: { must_haves: 4 } }
    expect(getScore('jd_parsing.must_haves')).toBe(4)
  })

  it('should return undefined when an intermediate key is missing', () => {
    state.ann = { jd_parsing: {} }
    expect(getScore('jd_parsing.must_haves')).toBeUndefined()
  })
})

describe('setScore', () => {
  beforeEach(() => { state.ann = {} })

  it('should set a value at a single-level key', () => {
    setScore('score', 5)
    expect(state.ann.score).toBe(5)
  })

  it('should set a value at a nested dot-notation path', () => {
    setScore('jd_parsing.must_haves', 3)
    expect(state.ann.jd_parsing.must_haves).toBe(3)
  })

  it('should create intermediate objects when they do not exist', () => {
    setScore('a.b.c', 'value')
    expect(state.ann.a.b.c).toBe('value')
  })

  it('should overwrite an existing value at the same path', () => {
    state.ann = { score: 1 }
    setScore('score', 5)
    expect(state.ann.score).toBe(5)
  })
})

describe('esc', () => {
  it('should escape ampersands', () => {
    expect(esc('a & b')).toBe('a &amp; b')
  })

  it('should escape less-than signs', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;')
  })

  it('should escape greater-than signs', () => {
    expect(esc('a > b')).toBe('a &gt; b')
  })

  it('should return an empty string for null', () => {
    expect(esc(null)).toBe('')
  })

  it('should return an empty string for undefined', () => {
    expect(esc(undefined)).toBe('')
  })

  it('should return the string unchanged when no special characters are present', () => {
    expect(esc('hello world')).toBe('hello world')
  })
})

describe('TAB_RUBRICS', () => {
  it('should define must_haves and completeness annotation keys for the jd tab', () => {
    expect(TAB_RUBRICS.jd).toContain('jd_parsing.must_haves')
    expect(TAB_RUBRICS.jd).toContain('jd_parsing.completeness')
  })

  it('should define profile as an annotation key for the resume tab', () => {
    expect(TAB_RUBRICS.resume).toContain('resume_parsing.profile')
  })

  it('should define structural integrity as an annotation key for the analysis tab', () => {
    expect(TAB_RUBRICS.analysis).toContain('interview_analysis.structural_integrity')
  })
})
