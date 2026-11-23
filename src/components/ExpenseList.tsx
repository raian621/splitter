import { formatCents, getPersonName } from "../core/expense";
import type { Expense, Person } from "../core/types";

export type ExpenseListProps = {
  expenses: Expense[];
  people: Person[];
  onRemoveExpense: (id: string) => void;
};

export function ExpenseList({ expenses, people, onRemoveExpense }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div>
        <p className="hint">No expenses yet.</p>
      </div>
    );
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <li key={expense.id} className="expense-card">
          <div className="expense-info">
            <span className="expense-description">{expense.description}</span>
            <span className="expense-amount">{formatCents(expense.amount)}</span>
          </div>
          <div className="expense-meta">
            Paid by <strong>{getPersonName(people, expense.payerId)}</strong> ·{" "}
            {expense.splitMethod === "equal"
              ? `Split equally among ${expense.participantIds.length} people`
              : "Split proportionally by items"}
          </div>

          {expense.splitMethod === "itemized" && (
            <div className="expense-breakdown">
              {expense.items && expense.items.length > 0 && (
                <div className="breakdown-section">
                  <h4>Items</h4>
                  <ul>
                    {expense.items.map((item) => (
                      <li key={item.id}>
                        <span>{item.description || "Untitled item"}</span>
                        <span>{formatCents(item.amount)}</span>
                        <span className="breakdown-consumers">
                          {item.consumerIds.map((id) => getPersonName(people, id)).join(", ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expense.fees && expense.fees.length > 0 && (
                <div className="breakdown-section">
                  <h4>Fees</h4>
                  <ul>
                    {expense.fees.map((fee) => (
                      <li key={fee.id}>
                        <span>{fee.description || "Untitled fee"}</span>
                        <span>
                          {fee.type === "rate"
                            ? `${(fee.value * 100).toFixed(2)}%`
                            : formatCents(fee.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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
  );
}
