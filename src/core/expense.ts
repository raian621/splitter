import type { Balance, Expense, Person } from './types'

export function splitExpense(expense: Expense): Balance[] {
  if (expense.participantIds.length === 0) {
    return []
  }

  const balances: Balance[] = []

  // Payer paid the full amount, so they are owed the total
  balances.push({
    personId: expense.payerId,
    amount: expense.amount,
  })

  const share = Math.floor(expense.amount / expense.participantIds.length)
  const remainder = expense.amount - share * expense.participantIds.length

  for (let i = 0; i < expense.participantIds.length; i++) {
    const participantId = expense.participantIds[i]
    const amount = share + (i < remainder ? 1 : 0)

    balances.push({
      personId: participantId,
      amount: -amount,
    })
  }

  return balances
}

export function aggregateBalances(balances: Balance[]): Balance[] {
  const map = new Map<string, number>()

  for (const balance of balances) {
    const current = map.get(balance.personId) ?? 0
    map.set(balance.personId, current + balance.amount)
  }

  return Array.from(map.entries()).map(([personId, amount]) => ({
    personId,
    amount,
  }))
}

export function computeBalancesFromExpenses(expenses: Expense[]): Balance[] {
  const allBalances = expenses.flatMap(splitExpense)
  return aggregateBalances(allBalances)
}

export function validateExpense(expense: Expense): string | null {
  if (expense.amount <= 0) {
    return 'Amount must be greater than zero'
  }

  if (expense.participantIds.length === 0) {
    return 'At least one participant is required'
  }

  if (!expense.participantIds.includes(expense.payerId)) {
    return 'Payer must be a participant'
  }

  return null
}

export function formatCents(cents: number): string {
  const isNegative = cents < 0
  const dollars = Math.abs(cents) / 100
  return `${isNegative ? '-' : ''}$${dollars.toFixed(2)}`
}

export function getPersonName(people: Person[], personId: string): string {
  return people.find((p) => p.id === personId)?.name ?? personId
}
