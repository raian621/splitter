import type { Balance, Transaction } from "./types";

export function settleDebts(balances: Balance[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Work on a mutable copy, sorted so we match largest creditors/debtors first
  const remaining = balances
    .map((b) => ({ ...b }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Find a creditor (positive balance) and a debtor (negative balance)
    const creditorIndex = remaining.findIndex((b) => b.amount > 0);
    const debtorIndex = remaining.findIndex((b) => b.amount < 0);

    if (creditorIndex === -1 || debtorIndex === -1) {
      break;
    }

    const creditor = remaining[creditorIndex];
    const debtor = remaining[debtorIndex];

    const amount = Math.min(creditor.amount, -debtor.amount);

    transactions.push({
      from: debtor.personId,
      to: creditor.personId,
      amount,
    });

    creditor.amount -= amount;
    debtor.amount += amount;
  }

  return transactions;
}
