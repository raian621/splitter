import { Money } from "./money";
import type { Balance, Expense, Fee, Item, Person } from "./types";

export function splitExpense(expense: Expense): Balance[] {
  if (expense.splitMethod === "itemized") {
    return splitItemizedExpense(expense);
  }

  return splitEqualExpense(expense);
}

export function calculateExpenseContributions(
  expense: Expense,
): { personId: string; amount: Money }[] {
  const balances = splitExpense(expense);
  return balances
    .filter((balance) => balance.amount.units < 0)
    .map((balance) => ({
      personId: balance.personId,
      amount: balance.amount.abs(),
    }));
}

function splitEqualExpense(expense: Expense): Balance[] {
  if (expense.participantIds.length === 0) {
    return [];
  }

  const balances: Balance[] = [];

  // Payer paid the full amount, so they are owed the total
  balances.push({
    personId: expense.payerId,
    amount: Money.fromCents(expense.amount),
  });

  const share = Math.floor(expense.amount / expense.participantIds.length);
  const remainder = expense.amount - share * expense.participantIds.length;

  for (let i = 0; i < expense.participantIds.length; i++) {
    const participantId = expense.participantIds[i];
    const amount = share + (i < remainder ? 1 : 0);

    balances.push({
      personId: participantId,
      amount: Money.fromCents(amount).neg(),
    });
  }

  return balances;
}

function splitItemizedExpense(expense: Expense): Balance[] {
  const items = expense.items ?? [];
  const fees = expense.fees ?? [];

  if (items.length === 0) {
    return [];
  }

  const itemShares = calculateItemShares(items);
  const feeShares = calculateFeeShares(itemShares, fees);

  const balances: Balance[] = [];

  // Payer paid the full amount, so they are owed the total
  balances.push({
    personId: expense.payerId,
    amount: Money.fromCents(expense.amount),
  });

  for (const [personId, share] of itemShares.entries()) {
    const feeShare = feeShares.get(personId) ?? 0;
    balances.push({
      personId,
      amount: Money.add(share, Money.fromCents(feeShare)).neg(),
    });
  }

  return balances;
}

export function calculateItemShares(items: Item[]): Map<string, Money> {
  const shares = new Map<string, Money>();

  for (const item of items) {
    if (item.consumerIds.length === 0) {
      continue;
    }

    const share = Money.div(item.amount, item.consumerIds.length);
    // hopefully, there will be less than 1e9 contributors to the bill:
    const remainderNanos = Money.sub(
      item.amount,
      Money.mul(share, item.consumerIds.length),
    ).nanos;

    for (let i = 0; i < item.consumerIds.length; i++) {
      const consumerId = item.consumerIds[i];
      const amount = Money.add(share, new Money(0, i < remainderNanos ? 1 : 0));
      const current = shares.get(consumerId) ?? Money.ZERO();
      shares.set(consumerId, Money.add(current, amount));
    }
  }

  return shares;
}

export function calculateFeeTotal(itemTotal: Money, fee: Fee): number {
  return fee.type === "rate"
    ? Math.round(fee.value * itemTotal.cents())
    : fee.value;
}

export function calculateFeeShares(
  itemShares: Map<string, Money>,
  fees: Fee[],
): Map<string, number> {
  const feeShares = new Map<string, number>();
  const totalItemAmount = Array.from(itemShares.values()).reduce(
    Money.add,
    Money.ZERO(),
  );

  if (Money.cmp(totalItemAmount, Money.ZERO()) === 0) {
    return feeShares;
  }

  for (const fee of fees) {
    const totalFee = calculateFeeTotal(totalItemAmount, fee);
    const distributedFee = distributeAmount(totalFee, itemShares);

    for (const [personId, share] of distributedFee.entries()) {
      const current = feeShares.get(personId) ?? 0;
      feeShares.set(personId, current + share);
    }
  }

  return feeShares;
}

export function calculateItemizedTotal(items: Item[], fees: Fee[]): number {
  const itemTotal = items.reduce(
    (sum, item) => Money.add(sum, item.amount),
    Money.ZERO(),
  );
  const feeTotal = fees.reduce(
    (sum, fee) => sum + calculateFeeTotal(itemTotal, fee),
    0,
  );
  return itemTotal.cents() + feeTotal;
}

function distributeAmount(
  amount: number,
  weights: Map<string, Money>,
): Map<string, number> {
  const result = new Map<string, number>();
  const totalWeight = Array.from(weights.values()).reduce(
    (sum, weight) => sum + weight.cents(),
    0,
  );

  if (totalWeight === 0) {
    return result;
  }

  let distributed = 0;
  const fractions: { personId: string; fraction: number }[] = [];

  for (const [personId, weight] of weights.entries()) {
    const exact = (amount * weight.cents()) / totalWeight;
    const share = Math.floor(exact);
    result.set(personId, share);
    distributed += share;
    fractions.push({ personId, fraction: exact - share });
  }

  const remainder = amount - distributed;
  if (remainder > 0) {
    fractions.sort((a, b) => b.fraction - a.fraction);
    for (let i = 0; i < remainder; i++) {
      const personId = fractions[i % fractions.length].personId;
      result.set(personId, (result.get(personId) ?? 0) + 1);
    }
  }

  return result;
}

export function aggregateBalances(balances: Balance[]): Balance[] {
  const map = new Map<string, Money>();

  for (const balance of balances) {
    const current = map.get(balance.personId) ?? new Money(0, 0);
    map.set(balance.personId, Money.add(current, balance.amount));
  }

  return Array.from(map.entries()).map(([personId, amount]) => ({
    personId,
    amount,
  }));
}

export function computeBalancesFromExpenses(expenses: Expense[]): Balance[] {
  const allBalances = expenses.flatMap(splitExpense);
  return aggregateBalances(allBalances);
}

export function validateExpense(expense: Expense): string | null {
  if (expense.amount <= 0) {
    return "Amount must be greater than zero";
  }

  if (expense.splitMethod === "itemized") {
    return validateItemizedExpense(expense);
  }

  if (expense.participantIds.length === 0) {
    return "At least one participant is required";
  }

  if (!expense.participantIds.includes(expense.payerId)) {
    return "Payer must be a participant";
  }

  return null;
}

function validateItemizedExpense(expense: Expense): string | null {
  const items = expense.items ?? [];
  const fees = expense.fees ?? [];

  if (items.length === 0) {
    return "At least one item is required";
  }

  for (const item of items) {
    if (Money.cmp(item.amount, Money.ZERO()) <= 0) {
      return `Item "${item.description || "Untitled"}" must have a positive amount`;
    }

    if (item.consumerIds.length === 0) {
      return `Item "${item.description || "Untitled"}" must have at least one consumer`;
    }
  }

  for (const fee of fees) {
    if (fee.value < 0) {
      return `Fee "${fee.description || "Untitled"}" cannot be negative`;
    }

    if (fee.type !== "rate" && fee.type !== "amount") {
      return `Fee "${fee.description || "Untitled"}" must be a rate or amount`;
    }
  }

  const calculatedTotal = calculateItemizedTotal(items, fees);
  if (calculatedTotal !== expense.amount) {
    return "Expense total does not match items and fees";
  }

  return null;
}

export function formatCents(cents: number): string {
  const isNegative = cents < 0;
  const dollars = Math.abs(cents) / 100;
  return `${isNegative ? "-" : ""}$${dollars.toFixed(2)}`;
}

export function getPersonName(people: Person[], personId: string): string {
  return people.find((p) => p.id === personId)?.name ?? personId;
}
