import { describe, expect, it } from 'vitest'
import { change, niceScale, tooltipLeft } from '../scale'

describe('niceScale', () => {
  it('rounds the top up to a clean number with even steps', () => {
    expect(niceScale(7)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] })
    expect(niceScale(37)).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] })
    expect(niceScale(1234)).toEqual({ max: 1500, ticks: [0, 500, 1000, 1500] })
    expect(niceScale(10)).toEqual({ max: 10, ticks: [0, 5, 10] })
    expect(niceScale(23)).toEqual({ max: 30, ticks: [0, 10, 20, 30] })
  })

  it('gives small counts a 0–4 axis with whole-number steps', () => {
    expect(niceScale(1)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
    expect(niceScale(3)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
  })

  it('still draws an axis when everything is zero', () => {
    expect(niceScale(0)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
  })
})

describe('change', () => {
  it('compares this period with the previous one', () => {
    expect(change(12, 10)).toEqual({ diff: 2, percent: 20, direction: 'up' })
    expect(change(5, 10)).toEqual({ diff: -5, percent: -50, direction: 'down' })
    expect(change(4, 4)).toEqual({ diff: 0, percent: 0, direction: 'flat' })
  })

  it('has no percentage when there was nothing before', () => {
    expect(change(3, 0)).toEqual({ diff: 3, percent: null, direction: 'up' })
    expect(change(0, 0)).toEqual({ diff: 0, percent: null, direction: 'flat' })
  })
})

describe('tooltipLeft', () => {
  it('sits right of the crosshair, flipping left near the right edge', () => {
    expect(tooltipLeft(100, 600, 160)).toBe(114)
    expect(tooltipLeft(500, 600, 160)).toBe(326)
  })

  it('never leaves the chart, even on a narrow phone', () => {
    expect(tooltipLeft(150, 280, 200)).toBe(0) // would start at -64 when flipped
    expect(tooltipLeft(60, 280, 200)).toBe(74)
    expect(tooltipLeft(140, 280, 200)).toBe(0)
  })
})
