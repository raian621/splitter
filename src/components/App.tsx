import { useEffect, useMemo, useState } from "react";
import {
  computeBalancesFromExpenses,
  formatCents,
  getPersonName,
} from "../core/expense";
import { deserializeLedger, serializeLedger } from "../core/serialize";
import { settleDebts } from "../core/settlement";
import type { Expense, Ledger, Person } from "../core/types";
import { BalancesView } from "./BalancesView";
import { ExpenseBreakdownModal } from "./ExpenseBreakdownModal";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { Modal } from "./Modal";
import { PeopleManager } from "./PeopleManager";
import { SettlementView } from "./SettlementView";
import "../styles/App.css";
import { getIdGenerator } from "../core/id-util";

const defaultPeople: Person[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Carol" },
];

function App() {
  const [people, setPeople] = useState<Person[]>(defaultPeople);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(
    undefined,
  );
  const [breakdownExpense, setBreakdownExpense] = useState<Expense | undefined>(
    undefined,
  );
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [getId, setGetId] = useState<() => number>(() =>
    getIdGenerator(people.length + 1),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLedger() {
      const params = new URLSearchParams(window.location.search);
      const ledgerParam = params.get("ledger");
      if (!ledgerParam) return;

      try {
        const ledger = await deserializeLedger(ledgerParam);
        if (cancelled) return;
        setPeople(Array.isArray(ledger.people) ? ledger.people : defaultPeople);
        setExpenses(Array.isArray(ledger.expenses) ? ledger.expenses : []);
        const maxLedgerId = Math.max(
          ...people
            .map((p) => p.id)
            .concat(expenses.map((e) => e.id))
            .map((strId) => {
              const maybeInt = parseInt(strId);
              return Number.isNaN(maybeInt) ? 0 : maybeInt;
            }),
        );
        setGetId(() => getIdGenerator(maxLedgerId));
      } catch {
        if (cancelled) return;
        setUrlError(
          "Could not load the shared bill. The link may be invalid or corrupted.",
        );
      }
    }

    loadLedger();

    return () => {
      cancelled = true;
    };
  }, []); // oxlint-disable-line react-hooks/exhaustive-deps

  const balances = useMemo(
    () => computeBalancesFromExpenses(expenses),
    [expenses],
  );

  const transactions = useMemo(() => settleDebts(balances), [balances]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const handleAddPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newPerson: Person = {
      id: getId().toString(),
      name: trimmed,
    };
    setPeople((prev) => [...prev, newPerson]);
  };

  const handleRemovePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setExpenses((prev) =>
      prev.filter((e) => e.payerId !== id && !e.participantIds.includes(id)),
    );
  };

  const openAddModal = () => {
    setEditingExpense(undefined);
    setIsExpenseModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const closeModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(undefined);
  };

  const openBreakdownModal = (expense: Expense) => {
    setBreakdownExpense(expense);
  };

  const closeBreakdownModal = () => {
    setBreakdownExpense(undefined);
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
    closeModal();
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    closeModal();
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleShare = async () => {
    const ledger: Ledger = { people, expenses };
    const serialized = await serializeLedger(ledger);
    const url = new URL(window.location.href);
    url.search = `?ledger=${encodeURIComponent(serialized)}`;

    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage("Link copied to clipboard!");
      setTimeout(() => setShareMessage(null), 3000);
    } catch {
      setShareMessage("Could not copy link automatically.");
      setTimeout(() => setShareMessage(null), 3000);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bill Splitter Tool</h1>
        <p>Split bills and settle debts with minimum transactions.</p>
      </header>

      <main className="app-main">
        {urlError && (
          <section className="panel error-panel">
            <p className="error">{urlError}</p>
          </section>
        )}

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
              onClick={openAddModal}
              disabled={people.length < 2}
            >
              Add expense
            </button>
          </div>
          {people.length < 2 ? (
            <p className="hint">
              Add at least two people to create an expense.
            </p>
          ) : (
            <>
              <ExpenseList
                expenses={expenses}
                people={people}
                onRemoveExpense={handleRemoveExpense}
                onEditExpense={openEditModal}
                onViewBreakdown={openBreakdownModal}
              />

              <ExpenseBreakdownModal
                expense={breakdownExpense}
                people={people}
                isOpen={breakdownExpense !== undefined}
                onClose={closeBreakdownModal}
              />
            </>
          )}
        </section>

        <Modal
          isOpen={isExpenseModalOpen}
          onClose={closeModal}
          title={editingExpense ? "Edit expense" : "Add an expense"}
        >
          <ExpenseForm
            key={editingExpense?.id ?? "new"}
            people={people}
            expenseToEdit={editingExpense}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            getId={getId}
          />
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
          <BalancesView balances={balances} people={people} />
        </section>

        <section className="panel">
          <SettlementView
            transactions={transactions}
            people={people}
            getPersonName={(id) => getPersonName(people, id)}
          />
        </section>

        <button
          type="button"
          className="button button-primary"
          onClick={handleShare}
        >
          Share bill
        </button>
        {shareMessage !== null && (
          <p className="share-message" role="status">
            {shareMessage}
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
