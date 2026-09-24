import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fixtureOpportunities } from './fixtures'
import { OpportunityCard } from './opportunity-card'

describe('OpportunityCard', () => {
  it('shows score evidence, risk and data status without trade language', () => {
    render(<OpportunityCard opportunity={fixtureOpportunities[0]} locale="tr-TR" emphasis="primary" />)

    expect(screen.getByText(/Phanfora Skoru/)).toBeInTheDocument()
    expect(screen.getByText(fixtureOpportunities[0].primaryRisk)).toBeInTheDocument()
    expect(screen.getByText(/Demo verisi/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /al|sat/i })).not.toBeInTheDocument()
  })
})
