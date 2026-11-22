import { formatCents, getPersonName } from '../core/expense'
import type { Expense, Person } from '../core/types'

export type ExpenseListProps = {
  expenses: Expense[]
  people: Person[]
  onRemoveExpense: (id: string) => void
}

export function ExpenseList({
  expenses,
  people,
  onRemoveExpense,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div>
        <p className="hint">No expenses yet.</p>
      </div>
    )
  }

  return (
    <div>
      <ul className="expense-list">
        {expenses.map((expense) => (
          <li key={expense.id} className="expense-card">
            <div className="expense-info">
              <span className="expense-description">
                {expense.description}
              </span>
              <span className="expense-amount">
                {formatCents(expense.amount)}
              </span>
            </div>
            <div className="expense-meta">
              Paid by{' '}
              <strong>{getPersonName(people, expense.payerId)}</strong> · Split
              equally among {expense.participantIds.length} people
            </div>
            <button
              type="button"
              className="button button-small"
              onClick={() => onRemoveExpense(expense.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
