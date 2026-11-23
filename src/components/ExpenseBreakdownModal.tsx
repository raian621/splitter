import {
  calculateExpenseContributions,
  formatCents,
  getPersonName,
} from "../core/expense";
import type { Expense, Person } from "../core/types";
import "../styles/ExpenseBreakdownModal.css";
import { Modal } from "./Modal";

export type ExpenseBreakdownModalProps = {
  expense: Expense | undefined;
  people: Person[];
  isOpen: boolean;
  onClose: () => void;
};

export function ExpenseBreakdownModal({
  expense,
  people,
  isOpen,
  onClose,
}: ExpenseBreakdownModalProps) {
  if (!expense) {
    return null;
  }

  const contributions = calculateExpenseContributions(expense);
  const totalContributions = contributions.reduce(
    (sum, c) => sum + c.amount,
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Breakdown: ${expense.description || "Expense"}`}
    >
      <div className="breakdown-modal">
        <div className="breakdown-modal-total">
          <span className="breakdown-modal-label">Total</span>
          <span className="breakdown-modal-value">
            {formatCents(expense.amount)}
          </span>
        </div>

        <h3 className="breakdown-modal-heading">Each person owes</h3>
        <ul className="breakdown-modal-list">
          {contributions.map((contribution) => (
            <li key={contribution.personId} className="breakdown-modal-row">
              <span className="breakdown-modal-name">
                {getPersonName(people, contribution.personId)}
              </span>
              <span className="breakdown-modal-amount">
                {formatCents(contribution.amount)}
              </span>
            </li>
          ))}
        </ul>

        <div className="breakdown-modal-total breakdown-modal-total--subtle">
          <span className="breakdown-modal-label">Sum of contributions</span>
          <span className="breakdown-modal-value">
            {formatCents(totalContributions)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
