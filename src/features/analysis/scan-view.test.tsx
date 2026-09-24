import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScanView } from './scan-view'

describe('ScanView', () => {
  it('announces the current real computation stage without fake progress', () => {
    render(<ScanView locale="tr-TR" stage="risk" />)

    expect(screen.getAllByText('Risk uyumu hesaplanıyor')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Risk uyumu hesaplanıyor')
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
