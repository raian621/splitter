import { useMemo, useState } from "react";
import {
  calculateItemizedTotal,
  formatCents,
  validateExpense,
} from "../core/expense";
import type { Expense, Fee, Item, Person } from "../core/types";

export type ExpenseFormProps = {
  people: Person[];
  expenseToEdit?: Expense;
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
};

function createEmptyItem(): Item {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: 0,
    consumerIds: [],
  };
}

function createDefaultFee(): Fee {
  return {
    id: crypto.randomUUID(),
    description: "Tax",
    type: "rate",
    value: 0.0875,
  };
}

function initializeState(expenseToEdit: Expense | undefined, people: Person[]) {
  console.log("initializing state...", expenseToEdit, people);
  if (!expenseToEdit) {
    return {
      description: "",
      amount: "",
      payerId: "",
      splitMethod: "equal" as const,
      selectedParticipantIds: people.map((p) => p.id) as string[],
      items: [createEmptyItem()],
      fees: [createDefaultFee()],
    };
  }

  return {
    description: expenseToEdit.description,
    amount: (expenseToEdit.amount / 100).toFixed(2),
    payerId: expenseToEdit.payerId,
    splitMethod: expenseToEdit.splitMethod,
    selectedParticipantIds: expenseToEdit.participantIds.filter(
      (id) => id !== expenseToEdit.payerId,
    ),
    items:
      expenseToEdit.items && expenseToEdit.items.length > 0
        ? expenseToEdit.items
        : [createEmptyItem()],
    fees:
      expenseToEdit.fees && expenseToEdit.fees.length > 0
        ? expenseToEdit.fees
        : [createDefaultFee()],
  };
}

function formatFloat(numFloat: number, decimalPlaces: number): string {
  const numStr = numFloat.toFixed(decimalPlaces);

  // decimal without trailing zeros:
  if (!numStr.endsWith("0")) {
    return numStr;
  }

  // whole number:
  const wholeNumberRegex = /\d\.0+$/;
  if (wholeNumberRegex.test(numStr)) {
    return numStr.replace(/\.0+$/, "");
  }

  // decimal with trailing zeros:
  return numStr.replace(/0+$/, "");
}

export function ExpenseForm({
  people,
  expenseToEdit,
  onAddExpense,
  onUpdateExpense,
}: ExpenseFormProps) {
  const initialState = useMemo(
    () => initializeState(expenseToEdit, people),
    [expenseToEdit, people],
  );

  const [description, setDescription] = useState(initialState.description);
  const [amount, setAmount] = useState(initialState.amount);
  const [payerId, setPayerId] = useState(initialState.payerId);
  const [splitMethod, setSplitMethod] = useState<"equal" | "itemized">(
    initialState.splitMethod,
  );
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(initialState.selectedParticipantIds);
  const [items, setItems] = useState<Item[]>(initialState.items);
  const [fees, setFees] = useState<Fee[]>(initialState.fees);
  const [error, setError] = useState<string | null>(null);

  const isEditing = expenseToEdit !== undefined;

  const availableParticipants = useMemo(() => {
    return people.filter((p) => p.id !== payerId);
  }, [people, payerId]);

  const calculatedItemizedTotal = useMemo(() => {
    return calculateItemizedTotal(items, fees);
  }, [items, fees]);

  const handlePayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPayerId = event.target.value;
    setPayerId(newPayerId);
    setSelectedParticipantIds((prev) => prev.filter((id) => id !== newPayerId));
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const toggleItemConsumer = (itemId: string, personId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const consumerIds = item.consumerIds.includes(personId)
          ? item.consumerIds.filter((id) => id !== personId)
          : [...item.consumerIds, personId];
        return { ...item, consumerIds };
      }),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateFee = (id: string, updates: Partial<Fee>) => {
    setFees((prev) =>
      prev.map((fee) => (fee.id === id ? { ...fee, ...updates } : fee)),
    );
  };

  const addFee = () => {
    setFees((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", type: "rate", value: 0 },
    ]);
  };

  const removeFee = (id: string) => {
    setFees((prev) => prev.filter((fee) => fee.id !== id));
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPayerId("");
    setSelectedParticipantIds([]);
    setItems([createEmptyItem()]);
    setFees([createDefaultFee()]);
    setSplitMethod("equal");
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const amountInCents =
      splitMethod === "itemized"
        ? calculatedItemizedTotal
        : Math.round(parseFloat(amount) * 100);

    const participantIds =
      splitMethod === "itemized"
        ? Array.from(
            new Set([payerId, ...items.flatMap((item) => item.consumerIds)]),
          )
        : [payerId, ...selectedParticipantIds];

    const expense: Expense = {
      id: expenseToEdit?.id ?? crypto.randomUUID(),
      description: description.trim() || "Expense",
      amount: amountInCents,
      payerId,
      participantIds,
      splitMethod,
      items: splitMethod === "itemized" ? items : undefined,
      fees: splitMethod === "itemized" ? fees : undefined,
    };

    const validationError = validateExpense(expense);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEditing) {
      onUpdateExpense(expense);
    } else {
      onAddExpense(expense);
    }

    resetForm();
  };

  if (people.length < 2) {
    return (
      <div>
        <p className="hint">Add at least two people to create an expense.</p>
      </div>
    );
  }

  return (
    <div>
      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span className="form-label">Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner, Uber ride"
            className="input"
            required
          />
        </label>

        <label className="form-field">
          <span className="form-label">Paid by</span>
          <select
            value={payerId}
            onChange={handlePayerChange}
            className="input select"
            required
          >
            <option value="">Select payer</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="form-field">
          <legend className="form-label">Split method</legend>
          <div className="radio-row">
            <label className="radio-label">
              <input
                type="radio"
                name="splitMethod"
                value="equal"
                checked={splitMethod === "equal"}
                onChange={() => setSplitMethod("equal")}
              />
              <span>Equal</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="splitMethod"
                value="itemized"
                checked={splitMethod === "itemized"}
                onChange={() => setSplitMethod("itemized")}
              />
              <span>Itemized</span>
            </label>
          </div>
        </fieldset>

        {splitMethod === "equal" ? (
          <>
            <label className="form-field">
              <span className="form-label">Amount</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
                required
              />
            </label>

            <fieldset className="form-field">
              <legend className="form-label">Split equally between</legend>
              <div className="checkbox-grid">
                {payerId && (
                  <label className="checkbox-label checkbox-label--payer">
                    <input type="checkbox" checked disabled readOnly />
                    <span>
                      {people.find((p) => p.id === payerId)?.name} (payer)
                    </span>
                  </label>
                )}
                {availableParticipants.map((person) => (
                  <label key={person.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedParticipantIds.includes(person.id)}
                      onChange={() => toggleParticipant(person.id)}
                    />
                    <span>{person.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <div className="form-field">
              <span className="form-label">Items</span>
              <ul className="item-list">
                {items.map((item, index) => (
                  <li key={item.id} className="item-row">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, { description: e.target.value })
                      }
                      placeholder={`Item ${index + 1}`}
                      className="input item-description"
                      aria-label={`Item ${index + 1} description`}
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.amount / 100 || ""}
                      onChange={(e) =>
                        updateItem(item.id, {
                          amount: Math.round(parseFloat(e.target.value) * 100),
                        })
                      }
                      placeholder="0.00"
                      className="input item-amount"
                      aria-label={`Item ${index + 1} amount`}
                    />
                    <div className="item-consumers">
                      {people.map((person) => (
                        <label
                          key={person.id}
                          className="checkbox-label checkbox-label--compact"
                        >
                          <input
                            type="checkbox"
                            checked={item.consumerIds.includes(person.id)}
                            onChange={() =>
                              toggleItemConsumer(item.id, person.id)
                            }
                          />
                          <span>{person.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="button button-small"
                onClick={addItem}
              >
                + Add item
              </button>
            </div>

            <div className="form-field">
              <span className="form-label">Fees</span>
              <ul className="fee-list">
                {fees.map((fee, index) => (
                  <li key={fee.id} className="fee-row">
                    <input
                      type="text"
                      value={fee.description}
                      onChange={(e) =>
                        updateFee(fee.id, { description: e.target.value })
                      }
                      placeholder={`Fee ${index + 1}`}
                      className="input fee-description"
                      aria-label={`Fee ${index + 1} description`}
                    />
                    <select
                      value={fee.type}
                      onChange={(e) =>
                        updateFee(fee.id, {
                          type: e.target.value as "rate" | "amount",
                          value:
                            e.target.value === "rate"
                              ? fee.value / 100
                              : fee.value * 100,
                        })
                      }
                      className="input fee-type"
                      aria-label={`Fee ${index + 1} type`}
                    >
                      <option value="rate">%</option>
                      <option value="amount">$</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formatFloat(
                        fee.type === "rate" ? fee.value * 100 : fee.value / 100,
                        /*decimalPlaces=*/ 2,
                      )}
                      onChange={(e) =>
                        updateFee(fee.id, {
                          value:
                            fee.type === "rate"
                              ? parseFloat(e.target.value) / 100
                              : Math.round(parseFloat(e.target.value) * 100),
                        })
                      }
                      placeholder="0.00"
                      className="input fee-rate"
                      aria-label={`Fee ${index + 1} value`}
                    />
                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => removeFee(fee.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="button button-small"
                onClick={addFee}
              >
                + Add fee
              </button>
            </div>

            <div className="itemized-total">
              <span className="itemized-total-label">Calculated total</span>
              <span className="itemized-total-value">
                {formatCents(calculatedItemizedTotal)}
              </span>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" className="button button-primary">
          {isEditing ? "Update expense" : "Save expense"}
        </button>
      </form>
    </div>
  );
}
