import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PriceLineChart } from './price-line-chart'

describe('PriceLineChart', () => {
  it('describes and renders a flat series without invalid SVG points', () => {
    const { container } = render(
      <PriceLineChart
        symbol="FLAT"
        locale="en-US"
        series={[{ time: '2026-09-23', value: 10 }, { time: '2026-09-24', value: 10 }]}
      />,
    )
    expect(screen.getByRole('img', { name: /FLAT.*minimum 10.*maximum 10/i })).toBeInTheDocument()
    expect(container.querySelector('polyline')?.getAttribute('points')).not.toMatch(/NaN|Infinity/)
  })

  it('includes start, end, minimum and maximum in the accessible name', () => {
    render(
      <PriceLineChart
        symbol="RISE"
        locale="en-US"
        series={[{ time: '2026-09-23', value: 10 }, { time: '2026-09-24', value: 14 }]}
      />,
    )
    expect(screen.getByRole('img', { name: /RISE.*start 10.*end 14.*minimum 10.*maximum 14/i })).toBeInTheDocument()
  })
})
