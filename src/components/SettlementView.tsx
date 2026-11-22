import { formatCents } from '../core/expense'
import type { Person, Transaction } from '../core/types'

export type SettlementViewProps = {
  transactions: Transaction[]
  people: Person[]
  getPersonName: (id: string) => string
}

export function SettlementView({
  transactions,
  getPersonName,
}: SettlementViewProps) {
  if (transactions.length === 0) {
    return (
      <div>
        <h2>Settle up</h2>
        <p className="hint">No debts to settle.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Settle up</h2>
      <p className="settle-subtitle">
        Minimum transactions to settle all debts:
      </p>
      <ul className="transaction-list">
        {transactions.map((transaction, index) => (
          <li key={index} className="transaction-card">
            <span className="transaction-party">
              <strong>{getPersonName(transaction.from)}</strong>
            </span>
            <span className="transaction-arrow">pays</span>
            <span className="transaction-amount">
              {formatCents(transaction.amount)}
            </span>
            <span className="transaction-arrow">to</span>
            <span className="transaction-party">
              <strong>{getPersonName(transaction.to)}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
