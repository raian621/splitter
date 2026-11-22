import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('allows adding people and expenses, then shows settlement', () => {
    render(<App />)

    // Add a new person
    const personInput = screen.getByLabelText('Person name')
    fireEvent.change(personInput, { target: { value: 'Dave' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Open the expense modal
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    // Add an expense
    fireEvent.change(screen.getByPlaceholderText('e.g. Dinner, Uber ride'), {
      target: { value: 'Taxi' },
    })
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '60' },
    })
    fireEvent.change(screen.getByLabelText('Paid by'), {
      target: { value: '1' },
    })

    // Select Bob and Carol as additional participants
    fireEvent.click(screen.getByLabelText('Bob'))
    fireEvent.click(screen.getByLabelText('Carol'))

    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))

    // Expense appears in list
    expect(screen.getByText('Taxi')).toBeInTheDocument()
    expect(screen.getAllByText('$60.00').length).toBeGreaterThanOrEqual(1)

    // Balances appear
    expect(screen.getByText('is owed $40.00')).toBeInTheDocument()
    expect(screen.getAllByText('owes $20.00').length).toBe(2)

    // Settlement appears
    expect(
      screen.getByText('Minimum transactions to settle all debts:')
    ).toBeInTheDocument()
  })
})
