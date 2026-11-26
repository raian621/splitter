import { Money } from "./money";
import type { Balance, Transaction } from "./types";

export function settleDebts(balances: Balance[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Work on a mutable copy, sorted so we match largest creditors/debtors first
  const remaining = balances
    .map((b) => ({ ...b }))
    .sort((a, b) => Money.cmp(b.amount.abs(), a.amount.abs()));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Find a creditor (positive balance) and a debtor (negative balance)
    const creditorIndex = remaining.findIndex(
      (b) => Money.cmp(b.amount, Money.ZERO()) > 0,
    );
    const debtorIndex = remaining.findIndex(
      (b) => Money.cmp(b.amount, Money.ZERO()) < 0,
    );

    if (creditorIndex === -1 || debtorIndex === -1) {
      break;
    }

    const creditor = remaining[creditorIndex];
    const debtor = remaining[debtorIndex];

    // TODO: replace this with a proper min function if we ever implement one.
    const amount = [creditor.amount, debtor.amount.neg()].sort(Money.cmp)[0];

    transactions.push({
      from: debtor.personId,
      to: creditor.personId,
      amount: moneyToCents(amount),
    });

    creditor.amount = Money.sub(creditor.amount, amount);
    debtor.amount = Money.add(debtor.amount, amount);
  }

  return transactions;
}

function moneyToCents(money: Money): number {
  return (
    money.units * 100 +
    (money.nanos < 0 ? Math.ceil : Math.floor)(money.nanos / 10_000_000)
  );
}
