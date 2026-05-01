import { describe, it, expect } from 'vitest'
import { state } from '../state.js'

describe('state', () => {
  it('should initialize datasets as an empty array', () => {
    expect(Array.isArray(state.datasets)).toBe(true)
    expect(state.datasets).toHaveLength(0)
  })

  it('should initialize idx as 0', () => {
    expect(state.idx).toBe(0)
  })

  it('should initialize data as null', () => {
    expect(state.data).toBeNull()
  })

  it('should initialize ann as an empty object', () => {
    expect(state.ann).toEqual({})
  })

  it('should initialize tab as jd', () => {
    expect(state.tab).toBe('jd')
  })

  it('should initialize rubrics as an empty object', () => {
    expect(state.rubrics).toEqual({})
  })

  it('should be mutable', () => {
    const original = state.idx
    state.idx = 5
    expect(state.idx).toBe(5)
    state.idx = original
  })
})
