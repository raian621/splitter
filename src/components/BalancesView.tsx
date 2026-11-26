import { getPersonName } from "../core/expense";
import { Money } from "../core/money";
import type { Balance, Person } from "../core/types";

export type BalancesViewProps = {
  balances: Balance[];
  people: Person[];
};

export function BalancesView({ balances, people }: BalancesViewProps) {
  const sortedBalances = [...balances].sort((a, b) => Money.cmp(b.amount, a.amount));

  return (
    <div>
      <h2>Balances</h2>
      {sortedBalances.length === 0 ? (
        <p className="hint">Add expenses to see balances.</p>
      ) : (
        <ul className="balance-list">
          {sortedBalances.map((balance) => {
            const name = getPersonName(people, balance.personId);
            const isOwed = Money.cmp(balance.amount, Money.ZERO()) > 0;
            const isOwes = Money.cmp(balance.amount, Money.ZERO()) < 0;

            return (
              <li
                key={balance.personId}
                className={`balance-row ${isOwed ? "balance-owed" : isOwes ? "balance-owes" : ""}`}
              >
                <span className="balance-name">{name}</span>
                <span className="balance-amount">
                  {isOwed
                    ? `is owed ${balance.amount.formatCents()}`
                    : isOwes
                      ? `owes ${balance.amount.abs().formatCents()}`
                      : "settled up"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
