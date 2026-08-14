import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthCardHeader } from './AuthCardHeader'

describe('AuthCardHeader', () => {
  it('renders the standard back action and product link', () => {
    render(
      <MemoryRouter>
        <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Allugme' })).toHaveAttribute('href', '/')
  })
})
