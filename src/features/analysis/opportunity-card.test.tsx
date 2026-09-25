import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fixtureOpportunities } from './fixtures'
import { OpportunityCard } from './opportunity-card'

describe('OpportunityCard', () => {
  it('shows score evidence, risk and data status without trade language', () => {
    render(<OpportunityCard opportunity={fixtureOpportunities[0]} locale="tr-TR" emphasis="primary" />)

    expect(screen.getByText(/Phanfora Skoru/)).toBeInTheDocument()
    expect(screen.getByText(fixtureOpportunities[0].primaryRisk)).toBeInTheDocument()
    expect(screen.getByText(/Demo verisi/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Al|Sat)$/i })).not.toBeInTheDocument()
  })

  it('opens the selected card score evidence without navigating away', async () => {
    const user = userEvent.setup()
    render(<OpportunityCard opportunity={fixtureOpportunities[0]} locale="en-US" emphasis="primary" />)

    await user.click(screen.getByRole('button', { name: 'Review analysis' }))

    expect(screen.getByRole('group', { name: 'How was the score calculated?' })).toHaveAttribute('open')
  })
})
