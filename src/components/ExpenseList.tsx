import { formatCents, getPersonName } from "../core/expense";
import type { Expense, Person } from "../core/types";
import "../styles/ExpenseList.css";

export type ExpenseListProps = {
  expenses: Expense[];
  people: Person[];
  onRemoveExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onViewBreakdown: (expense: Expense) => void;
};

export function ExpenseList({
  expenses,
  people,
  onRemoveExpense,
  onEditExpense,
  onViewBreakdown,
}: ExpenseListProps) {
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
            <span className="expense-amount">
              {formatCents(expense.amount)}
            </span>
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
                  <table>
                    <th>ITEM</th>
                    <th>COST</th>
                    <th>ORDERER</th>
                    {expense.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.description || "Untitled item"}</td>
                        <td>{formatCents(item.amount)}</td>
                        <td className="breakdown-consumers">
                          {item.consumerIds
                            .map((id) => getPersonName(people, id))
                            .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </table>
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

          <div className="expense-actions">
            <button
              type="button"
              className="button button-small"
              onClick={() => onViewBreakdown(expense)}
            >
              Breakdown
            </button>
            <button
              type="button"
              className="button button-small"
              onClick={() => onEditExpense(expense)}
            >
              Edit
            </button>
            <button
              type="button"
              className="button button-small"
              onClick={() => onRemoveExpense(expense.id)}
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
