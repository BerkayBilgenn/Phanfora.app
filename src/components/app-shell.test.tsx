import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('exposes navigation, skip link and main content', () => {
    render(<AppShell><h1>Bugün</h1></AppShell>)
    expect(screen.getByRole('link', { name: 'İçeriğe geç' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('navigation', { name: 'Ana navigasyon' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })
})
