import { describe, expect, it } from 'vitest'
import { safeRedirect } from '@/utils/safeRedirect'

describe('safeRedirect', () => {
  it.each([
    ['/Class/abc', '/Class/abc'],
    ['/Classes?view=shop', '/Classes?view=shop'],
    ['//evil.com', null],
    ['/\\evil.com', null],
    ['https://evil.com', null],
    ['javascript:alert(1)', null],
    ['/Login', null],
    ['/Login?redirect=/x', null],
    ['', null],
    [undefined, null],
    [['/Classes'], null],
  ])('%s → %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected)
  })
})
