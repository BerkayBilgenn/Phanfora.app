import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalysisExperience } from './analysis-experience'

describe('AnalysisExperience', () => {
  it('lets a user edit and rerun while preserving their choices', async () => {
    const user = userEvent.setup()
    render(<AnalysisExperience locale="en-US" />)

    await user.type(screen.getByLabelText('Amount to evaluate'), '2500')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Monthly' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Low' }))
    await user.click(screen.getByRole('button', { name: 'Scan markets' }))

    expect(await screen.findByRole('heading', { name: 'Featured opportunity' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit choices' }))

    expect(screen.getByLabelText('Amount to evaluate')).toHaveValue('2500')
  })
})
