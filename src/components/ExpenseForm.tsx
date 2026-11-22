import { useMemo, useState } from 'react'
import { validateExpense } from '../core/expense'
import type { Expense, Person } from '../core/types'

export type ExpenseFormProps = {
  people: Person[]
  onAddExpense: (expense: Expense) => void
}

export function ExpenseForm({ people, onAddExpense }: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState('')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([])
  const [error, setError] = useState<string | null>(null)

  const availableParticipants = useMemo(() => {
    return people.filter((p) => p.id !== payerId)
  }, [people, payerId])

  const handlePayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPayerId = event.target.value
    setPayerId(newPayerId)
    setSelectedParticipantIds((prev) => prev.filter((id) => id !== newPayerId))
  }

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const amountInCents = Math.round(parseFloat(amount) * 100)
    const participantIds = [payerId, ...selectedParticipantIds]

    const expense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim() || 'Expense',
      amount: amountInCents,
      payerId,
      participantIds,
      splitMethod: 'equal',
    }

    const validationError = validateExpense(expense)
    if (validationError) {
      setError(validationError)
      return
    }

    onAddExpense(expense)
    setDescription('')
    setAmount('')
    setPayerId('')
    setSelectedParticipantIds([])
  }

  if (people.length < 2) {
    return (
      <div>
        <h2>Add an expense</h2>
        <p className="hint">Add at least two people to create an expense.</p>
      </div>
    )
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
          <legend className="form-label">Split equally between</legend>
          <div className="checkbox-grid">
            {payerId && (
              <label className="checkbox-label checkbox-label--payer">
                <input
                  type="checkbox"
                  checked
                  disabled
                  readOnly
                />
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

        {error && <p className="error">{error}</p>}

        <button type="submit" className="button button-primary">
          Save expense
        </button>
      </form>
    </div>
  )
}
