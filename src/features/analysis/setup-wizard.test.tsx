import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SetupWizard } from './setup-wizard'

describe('SetupWizard', () => {
  it('collects amount, horizon and risk before completing', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<SetupWizard locale="tr-TR" onComplete={onComplete} />)

    await user.type(screen.getByLabelText('Değerlendirilecek tutar'), '5000')
    await user.click(screen.getByRole('button', { name: 'Devam et' }))
    await user.click(screen.getByRole('radio', { name: 'Haftalık' }))
    await user.click(screen.getByRole('button', { name: 'Devam et' }))
    await user.click(screen.getByRole('radio', { name: 'Dengeli' }))

    expect(screen.getByText('$5.000,00')).toBeInTheDocument()
    expect(screen.getByText('Haftalık')).toBeInTheDocument()
    expect(screen.getAllByText('Dengeli')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Piyasaları tara' }))

    expect(onComplete).toHaveBeenCalledWith({
      amount: '5000',
      currency: 'USD',
      horizon: 'weekly',
      riskProfile: 'balanced',
    })
  })

  it('restores saved choices when editing', () => {
    render(<SetupWizard locale="en-US" initialInput={{ amount: '2500', currency: 'EUR', horizon: 'monthly', riskProfile: 'low' }} />)

    expect(screen.getByLabelText('Amount to evaluate')).toHaveValue('2500')
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR')
  })
})
