import { formatDate } from '../formatDate'

describe('formatDate', () => {
  it('formats date to YYYY/MM/DD in ja-JP locale', () => {
    const date = new Date('2023-01-05T12:00:00Z')
    const formatted = formatDate(date)
    // ジャパンロケールでは '2023/01/05'
    expect(formatted).toBe('2023/01/05')
  })
  it('formats date with custom locale if specified', () => {
    const date = new Date('2023-12-31T00:00:00Z')
    const formatted = formatDate(date, 'en-US')
    expect(formatted).toBe('12/31/2023')
  })
})
