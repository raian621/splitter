import { describe, expect, it } from 'vitest'
import {
  aggregateBalances,
  computeBalancesFromExpenses,
  formatCents,
  getPersonName,
  splitExpense,
  validateExpense,
} from './expense'
import type { Expense, Person } from './types'

describe('splitExpense', () => {
  it('splits an expense equally among participants', () => {
    const expense: Expense = {
      id: '1',
      description: 'Dinner',
      amount: 10000, // $100.00
      payerId: 'alice',
      participantIds: ['alice', 'bob', 'carol'],
      splitMethod: 'equal',
    }

    const balances = splitExpense(expense)

    expect(balances).toEqual([
      { personId: 'alice', amount: 10000 },
      { personId: 'alice', amount: -3334 },
      { personId: 'bob', amount: -3333 },
      { personId: 'carol', amount: -3333 },
    ])
  })

  it('handles a single participant', () => {
    const expense: Expense = {
      id: '1',
      description: 'Solo ride',
      amount: 2500,
      payerId: 'alice',
      participantIds: ['alice'],
      splitMethod: 'equal',
    }

    const balances = splitExpense(expense)

    expect(balances).toEqual([
      { personId: 'alice', amount: 2500 },
      { personId: 'alice', amount: -2500 },
    ])
  })

  it('returns empty array when no participants', () => {
    const expense: Expense = {
      id: '1',
      description: 'Invalid',
      amount: 1000,
      payerId: 'alice',
      participantIds: [],
      splitMethod: 'equal',
    }

    expect(splitExpense(expense)).toEqual([])
  })
})

describe('aggregateBalances', () => {
  it('sums balances by person', () => {
    const balances = [
      { personId: 'alice', amount: 10000 },
      { personId: 'bob', amount: -5000 },
      { personId: 'alice', amount: -3000 },
      { personId: 'bob', amount: -2000 },
    ]

    expect(aggregateBalances(balances)).toEqual([
      { personId: 'alice', amount: 7000 },
      { personId: 'bob', amount: -7000 },
    ])
  })
})

describe('computeBalancesFromExpenses', () => {
  it('computes net balances across multiple expenses', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        description: 'Ride',
        amount: 3000,
        payerId: 'alice',
        participantIds: ['alice', 'bob'],
        splitMethod: 'equal',
      },
      {
        id: '2',
        description: 'Food',
        amount: 4000,
        payerId: 'bob',
        participantIds: ['alice', 'bob', 'carol'],
        splitMethod: 'equal',
      },
    ]

    const balances = computeBalancesFromExpenses(expenses)

    // Alice paid $30, owes $15 (ride) + $13.34 (food, first remainder) -> net +$1.66 -> 166
    // Bob paid $40, owes $15 (ride) + $13.33 (food) -> net +$11.67 -> 1167
    // Carol owes $13.33 -> -1333
    expect(balances).toContainEqual({ personId: 'alice', amount: 166 })
    expect(balances).toContainEqual({ personId: 'bob', amount: 1167 })
    expect(balances).toContainEqual({ personId: 'carol', amount: -1333 })

    const total = balances.reduce((sum, b) => sum + b.amount, 0)
    expect(total).toBe(0)
  })
})

describe('validateExpense', () => {
  it('returns error for non-positive amount', () => {
    const expense: Expense = {
      id: '1',
      description: 'Bad',
      amount: 0,
      payerId: 'alice',
      participantIds: ['alice'],
      splitMethod: 'equal',
    }

    expect(validateExpense(expense)).toBe('Amount must be greater than zero')
  })

  it('returns error when no participants', () => {
    const expense: Expense = {
      id: '1',
      description: 'Bad',
      amount: 1000,
      payerId: 'alice',
      participantIds: [],
      splitMethod: 'equal',
    }

    expect(validateExpense(expense)).toBe('At least one participant is required')
  })

  it('returns error when payer is not a participant', () => {
    const expense: Expense = {
      id: '1',
      description: 'Bad',
      amount: 1000,
      payerId: 'alice',
      participantIds: ['bob'],
      splitMethod: 'equal',
    }

    expect(validateExpense(expense)).toBe('Payer must be a participant')
  })

  it('returns null for valid expense', () => {
    const expense: Expense = {
      id: '1',
      description: 'Good',
      amount: 1000,
      payerId: 'alice',
      participantIds: ['alice', 'bob'],
      splitMethod: 'equal',
    }

    expect(validateExpense(expense)).toBeNull()
  })
})

describe('formatCents', () => {
  it('formats cents as dollars', () => {
    expect(formatCents(1234)).toBe('$12.34')
    expect(formatCents(0)).toBe('$0.00')
    expect(formatCents(-567)).toBe('-$5.67')
  })
})

describe('getPersonName', () => {
  const people: Person[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ]

  it('returns name when person exists', () => {
    expect(getPersonName(people, 'alice')).toBe('Alice')
  })

  it('returns id when person not found', () => {
    expect(getPersonName(people, 'carol')).toBe('carol')
  })
})
