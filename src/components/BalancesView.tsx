import { formatCents, getPersonName } from "../core/expense";
import type { Balance, Person } from "../core/types";

export type BalancesViewProps = {
  balances: Balance[];
  people: Person[];
};

export function BalancesView({ balances, people }: BalancesViewProps) {
  const sortedBalances = [...balances].sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <h2>Balances</h2>
      {sortedBalances.length === 0 ? (
        <p className="hint">Add expenses to see balances.</p>
      ) : (
        <ul className="balance-list">
          {sortedBalances.map((balance) => {
            const name = getPersonName(people, balance.personId);
            const isOwed = balance.amount > 0;
            const isOwes = balance.amount < 0;

            return (
              <li
                key={balance.personId}
                className={`balance-row ${isOwed ? "balance-owed" : isOwes ? "balance-owes" : ""}`}
              >
                <span className="balance-name">{name}</span>
                <span className="balance-amount">
                  {isOwed
                    ? `is owed ${formatCents(balance.amount)}`
                    : isOwes
                      ? `owes ${formatCents(Math.abs(balance.amount))}`
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
