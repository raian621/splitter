import { useMemo, useState } from "react";
import { computeBalancesFromExpenses, formatCents, getPersonName } from "../core/expense";
import { settleDebts } from "../core/settlement";
import type { Expense, Person } from "../core/types";
import { BalancesView } from "./BalancesView";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { Modal } from "./Modal";
import { PeopleManager } from "./PeopleManager";
import { SettlementView } from "./SettlementView";
import "../styles/App.css";

function App() {
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Carol" },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const balances = useMemo(() => computeBalancesFromExpenses(expenses), [expenses]);

  const transactions = useMemo(() => settleDebts(balances), [balances]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const handleAddPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: trimmed,
    };
    setPeople((prev) => [...prev, newPerson]);
  };

  const handleRemovePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setExpenses((prev) => prev.filter((e) => e.payerId !== id && !e.participantIds.includes(id)));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
    setIsExpenseModalOpen(false);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Splitter</h1>
        <p>Split bills and settle debts with minimum transactions.</p>
      </header>

      <main className="app-main">
        <section className="panel">
          <PeopleManager
            people={people}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
          />
        </section>

        <section className="panel">
          <div className="expense-section-header">
            <h2>Expenses</h2>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setIsExpenseModalOpen(true)}
              disabled={people.length < 2}
            >
              Add expense
            </button>
          </div>
          {people.length < 2 ? (
            <p className="hint">Add at least two people to create an expense.</p>
          ) : (
            <p className="hint">Click the button to add a new expense.</p>
          )}
        </section>

        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Add an expense"
        >
          <ExpenseForm people={people} onAddExpense={handleAddExpense} />
        </Modal>

        <section className="panel summary-panel">
          <h2>Summary</h2>
          <div className="summary-row">
            <span className="summary-label">People</span>
            <span className="summary-value">{people.length}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Expenses</span>
            <span className="summary-value">{expenses.length}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total</span>
            <span className="summary-value">{formatCents(totalExpenses)}</span>
          </div>
        </section>

        <section className="panel">
          <ExpenseList expenses={expenses} people={people} onRemoveExpense={handleRemoveExpense} />
        </section>

        <section className="panel">
          <BalancesView balances={balances} people={people} />
        </section>

        <section className="panel">
          <SettlementView
            transactions={transactions}
            people={people}
            getPersonName={(id) => getPersonName(people, id)}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
