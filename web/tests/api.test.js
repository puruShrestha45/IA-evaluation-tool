import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api } from '../api.js'

const mockResponse = (data) => ({ ok: true, json: () => Promise.resolve(data) })

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.getDatasets', () => {
  it('should fetch from /api/datasets', async () => {
    fetch.mockResolvedValueOnce(mockResponse([]))
    await api.getDatasets()
    expect(fetch).toHaveBeenCalledWith('/api/datasets')
  })

  it('should return the parsed JSON response', async () => {
    const datasets = [{ index: 0, candidate_name: 'Alice' }]
    fetch.mockResolvedValueOnce(mockResponse(datasets))
    expect(await api.getDatasets()).toEqual(datasets)
  })
})

describe('api.getDataset', () => {
  it('should fetch from /api/datasets/{idx}', async () => {
    fetch.mockResolvedValueOnce(mockResponse({}))
    await api.getDataset(2)
    expect(fetch).toHaveBeenCalledWith('/api/datasets/2')
  })
})

describe('api.getRubrics', () => {
  it('should fetch from /api/rubrics', async () => {
    fetch.mockResolvedValueOnce(mockResponse({}))
    await api.getRubrics()
    expect(fetch).toHaveBeenCalledWith('/api/rubrics')
  })
})

describe('api.getAnnotations', () => {
  it('should return empty object and skip fetch when no email is stored', async () => {
    const result = await api.getAnnotations(0)
    expect(result).toEqual({})
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should fetch annotations with email as a query param when email is stored', async () => {
    localStorage.setItem('eval_user_email', 'user@test.com')
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ score: 4 }) })
    const result = await api.getAnnotations(0)
    expect(fetch).toHaveBeenCalledWith('/api/annotations/0?email=user%40test.com')
    expect(result).toEqual({ score: 4 })
  })
})

describe('api.saveAnnotations', () => {
  it('should return error object when no email is stored', async () => {
    expect(await api.saveAnnotations(0, {})).toEqual({ ok: false, error: 'No email' })
  })

  it('should POST annotations with email in the body when email is stored', async () => {
    localStorage.setItem('eval_user_email', 'user@test.com')
    fetch.mockResolvedValueOnce(mockResponse({ ok: true }))
    await api.saveAnnotations(0, { score: 3 })
    expect(fetch).toHaveBeenCalledWith(
      '/api/annotations/0',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com', data: { score: 3 } }),
      })
    )
  })
})

describe('api.resetAnnotations', () => {
  it('should return error object when no email is stored', async () => {
    expect(await api.resetAnnotations(0)).toEqual({ ok: false, error: 'No email' })
  })

  it('should send DELETE request with email as a query param when email is stored', async () => {
    localStorage.setItem('eval_user_email', 'user@test.com')
    fetch.mockResolvedValueOnce(mockResponse({ ok: true }))
    await api.resetAnnotations(1)
    expect(fetch).toHaveBeenCalledWith(
      '/api/annotations/1?email=user%40test.com',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
