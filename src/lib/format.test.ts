import { describe, expect, it } from 'vitest'
import { normalizeLocalizedAmount } from './format'

describe('normalizeLocalizedAmount', () => {
  it('normalizes Turkish and English input without floating-point math', () => {
    expect(normalizeLocalizedAmount('1.250,50', 'tr-TR')).toBe('1250.50')
    expect(normalizeLocalizedAmount('1,250.50', 'en-US')).toBe('1250.50')
  })

  it('returns null for ambiguous or invalid input', () => {
    expect(normalizeLocalizedAmount('1,2,3', 'tr-TR')).toBeNull()
    expect(normalizeLocalizedAmount('1.2.3', 'tr-TR')).toBeNull()
    expect(normalizeLocalizedAmount('1,2,3', 'en-US')).toBeNull()
    expect(normalizeLocalizedAmount('-5', 'en-US')).toBeNull()
  })

  it('does not inflate an ungrouped decimal amount', () => {
    expect(normalizeLocalizedAmount('12.50', 'tr-TR')).toBe('12.50')
    expect(normalizeLocalizedAmount('12,50', 'en-US')).toBe('12.50')
  })
})
