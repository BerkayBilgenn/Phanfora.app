import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('introduces the decision flow', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('heading', { name: 'Piyasaları kendi koşullarına göre tara' }),
    ).toBeInTheDocument()
  })
})
