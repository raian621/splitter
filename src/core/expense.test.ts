import { describe, expect, it } from "vitest";
import {
  aggregateBalances,
  calculateExpenseContributions,
  calculateFeeTotal,
  calculateItemizedTotal,
  computeBalancesFromExpenses,
  formatCents,
  getPersonName,
  splitExpense,
  validateExpense,
} from "./expense";
import type { Expense, Fee, Item, Person } from "./types";
import { Money } from "./money";

describe("splitExpense", () => {
  it("splits an expense equally among participants", () => {
    const expense: Expense = {
      id: "1",
      description: "Dinner",
      amount: 10000, // $100.00
      payerId: "alice",
      participantIds: ["alice", "bob", "carol"],
      splitMethod: "equal",
    };

    const balances = splitExpense(expense);

    expect(balances).toEqual([
      { personId: "alice", amount: Money.parse("100") },
      { personId: "alice", amount: Money.parse("-33.34") },
      { personId: "bob", amount: Money.parse("-33.33") },
      { personId: "carol", amount: Money.parse("-33.33") },
    ]);
  });

  it("handles a single participant", () => {
    const expense: Expense = {
      id: "1",
      description: "Solo ride",
      amount: 2500,
      payerId: "alice",
      participantIds: ["alice"],
      splitMethod: "equal",
    };

    const balances = splitExpense(expense);

    expect(balances).toEqual([
      { personId: "alice", amount: Money.parse("25") },
      { personId: "alice", amount: Money.parse("-25") },
    ]);
  });

  it("returns empty array when no participants", () => {
    const expense: Expense = {
      id: "1",
      description: "Invalid",
      amount: 1000,
      payerId: "alice",
      participantIds: [],
      splitMethod: "equal",
    };

    expect(splitExpense(expense)).toEqual([]);
  });
});

describe("aggregateBalances", () => {
  it("sums balances by person", () => {
    const balances = [
      { personId: "alice", amount: Money.parse("100")! },
      { personId: "bob", amount: Money.parse("-50")! },
      { personId: "alice", amount: Money.parse("-30")! },
      { personId: "bob", amount: Money.parse("-20")! },
    ];

    expect(aggregateBalances(balances)).toEqual([
      { personId: "alice", amount: Money.parse("70") },
      { personId: "bob", amount: Money.parse("-70") },
    ]);
  });
});

describe("computeBalancesFromExpenses", () => {
  it("computes net balances across multiple expenses", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        description: "Ride",
        amount: 3000,
        payerId: "alice",
        participantIds: ["alice", "bob"],
        splitMethod: "equal",
      },
      {
        id: "2",
        description: "Food",
        amount: 4000,
        payerId: "bob",
        participantIds: ["alice", "bob", "carol"],
        splitMethod: "equal",
      },
    ];

    const balances = computeBalancesFromExpenses(expenses);

    // Alice paid $30, owes $15 (ride) + $13.34 (food, first remainder) -> net +$1.66 -> 166
    // Bob paid $40, owes $15 (ride) + $13.33 (food) -> net +$11.67 -> 1167
    // Carol owes $13.33 -> -1333
    expect(balances).toContainEqual({
      personId: "alice",
      amount: Money.parse("1.66"),
    });
    expect(balances).toContainEqual({
      personId: "bob",
      amount: Money.parse("11.67"),
    });
    expect(balances).toContainEqual({
      personId: "carol",
      amount: Money.parse("-13.33"),
    });

    const total = balances.reduce(
      (sum, b) => Money.add(sum, b.amount),
      new Money(0, 0),
    );
    expect(total).toEqual(Money.parse("0"));
  });
});

describe("splitExpense with itemized method", () => {
  it("splits items and taxes proportionally among consumers", () => {
    const expense: Expense = {
      id: "1",
      description: "Dinner",
      amount: 12875, // $100 items + $8.75 tax + $20.00 tip = $128.75
      payerId: "alice",
      participantIds: [],
      splitMethod: "itemized",
      items: [
        {
          id: "burger",
          description: "Burger",
          amount: Money.parse("15.00")!,
          consumerIds: ["alice"],
        },
        {
          id: "pizza",
          description: "Pizza",
          amount: Money.parse("30.00")!,
          consumerIds: ["bob", "carol"],
        },
        {
          id: "salad",
          description: "Salad",
          amount: Money.parse("55.00")!,
          consumerIds: ["alice", "bob", "carol"],
        },
      ],
      fees: [
        { id: "tax", description: "Tax", type: "rate", rate: 0.0875 },
        { id: "tip", description: "Tip", type: "rate", rate: 0.2 },
      ],
    };

    const balances = splitExpense(expense);

    // Item shares:
    // Alice: $15 + $18.34 salad = $33.34
    // Bob: $15 pizza + $18.33 salad = $33.33
    // Carol: $15 pizza + $18.33 salad = $33.33
    // Fee totals: tax $8.75 + tip $20.00 = $28.75, distributed proportionally
    expect(balances).toContainEqual({
      personId: "alice",
      amount: Money.parse("128.75"),
    });
    expect(balances).toContainEqual({
      personId: "alice",
      amount: new Money(-42, -916_666_666),
    });
    expect(balances).toContainEqual({
      personId: "bob",
      amount: new Money(-42, -916_666_667),
    });
    expect(balances).toContainEqual({
      personId: "carol",
      amount: new Money(-42, -916_666_667),
    });

    const total = balances.reduce(
      (sum, b) => Money.add(sum, b.amount),
      new Money(0, 0),
    );
    expect(total).toEqual(new Money(0, 0));
  });

  it("handles a single consumer item with no fees", () => {
    const expense: Expense = {
      id: "1",
      description: "Solo item",
      amount: 1000,
      payerId: "alice",
      participantIds: [],
      splitMethod: "itemized",
      items: [
        {
          id: "item1",
          description: "Item",
          amount: Money.parse("10.00")!,
          consumerIds: ["bob"],
        },
      ],
      fees: [],
    };

    const balances = splitExpense(expense);

    expect(balances).toEqual([
      { personId: "alice", amount: Money.parse("10.00") },
      { personId: "bob", amount: Money.parse("-10.00") },
    ]);
  });

  it("returns empty array when no items", () => {
    const expense: Expense = {
      id: "1",
      description: "Empty",
      amount: 0,
      payerId: "alice",
      participantIds: [],
      splitMethod: "itemized",
      items: [],
      fees: [],
    };

    expect(splitExpense(expense)).toEqual([]);
  });
});

describe("calculateItemizedTotal", () => {
  it("calculates total with fees", () => {
    const items: Item[] = [
      {
        id: "a",
        description: "A",
        amount: Money.parse("100.00")!,
        consumerIds: ["x"],
      },
    ];
    const fees: Fee[] = [
      { id: "tax", description: "Tax", type: "rate", rate: 0.0875 },
      { id: "tip", description: "Tip", type: "rate", rate: 0.18 },
    ];

    expect(calculateItemizedTotal(items, fees)).toEqual(Money.parse("126.75"));
  });
});

describe("calculateExpenseContributions", () => {
  it("returns equal contributions for an equal-split expense", () => {
    const expense: Expense = {
      id: "1",
      description: "Taxi",
      amount: 3000,
      payerId: "alice",
      participantIds: ["alice", "bob", "carol"],
      splitMethod: "equal",
    };

    const contributions = calculateExpenseContributions(expense);

    expect(contributions).toHaveLength(3);
    expect(contributions).toEqual(
      expect.arrayContaining([
        { personId: "alice", amount: Money.parse("10") },
        { personId: "bob", amount: Money.parse("10") },
        { personId: "carol", amount: Money.parse("10") },
      ]),
    );
  });

  it("returns proportional contributions for an itemized expense", () => {
    const expense: Expense = {
      id: "1",
      description: "Dinner",
      amount: 12875,
      payerId: "alice",
      participantIds: [],
      splitMethod: "itemized",
      items: [
        {
          id: "burger",
          description: "Burger",
          amount: Money.parse("15.00")!,
          consumerIds: ["alice"],
        },
        {
          id: "pizza",
          description: "Pizza",
          amount: Money.parse("30.00")!,
          consumerIds: ["bob", "carol"],
        },
        {
          id: "salad",
          description: "Salad",
          amount: Money.parse("55.00")!,
          consumerIds: ["alice", "bob", "carol"],
        },
      ],
      fees: [
        { id: "tax", description: "Tax", type: "rate", rate: 0.0875 },
        { id: "tip", description: "Tip", type: "rate", rate: 0.2 },
      ],
    };

    const contributions = calculateExpenseContributions(expense);

    expect(contributions).toHaveLength(3);
    expect(contributions).toEqual(
      expect.arrayContaining([
        { personId: "alice", amount: new Money(42, 916_666_666) },
        { personId: "bob", amount: new Money(42, 916_666_667) },
        { personId: "carol", amount: new Money(42, 916_666_667) },
      ]),
    );
  });
});

describe("calculateFeeTotal", () => {
  it("calculates rate-based fee from item total", () => {
    const rateFee: Fee = {
      id: "tax",
      description: "Tax",
      type: "rate",
      rate: 0.0875,
    };
    expect(calculateFeeTotal(Money.parse("100.00")!, rateFee)).toEqual(
      Money.parse("8.75"),
    );
  });

  it("returns fixed amount for amount-based fee", () => {
    const amountFee: Fee = {
      id: "service",
      description: "Service",
      type: "amount",
      amount: Money.parse("5")!,
    };
    expect(calculateFeeTotal(Money.parse("100.00")!, amountFee)).toEqual(
      Money.parse("5"),
    );
  });
});

describe("validateExpense", () => {
  it("returns error for non-positive amount", () => {
    const expense: Expense = {
      id: "1",
      description: "Bad",
      amount: 0,
      payerId: "alice",
      participantIds: ["alice"],
      splitMethod: "equal",
    };

    expect(validateExpense(expense)).toBe("Amount must be greater than zero");
  });

  it("returns error when no participants", () => {
    const expense: Expense = {
      id: "1",
      description: "Bad",
      amount: 1000,
      payerId: "alice",
      participantIds: [],
      splitMethod: "equal",
    };

    expect(validateExpense(expense)).toBe(
      "At least one participant is required",
    );
  });

  it("returns error when payer is not a participant", () => {
    const expense: Expense = {
      id: "1",
      description: "Bad",
      amount: 1000,
      payerId: "alice",
      participantIds: ["bob"],
      splitMethod: "equal",
    };

    expect(validateExpense(expense)).toBe("Payer must be a participant");
  });

  it("returns null for valid expense", () => {
    const expense: Expense = {
      id: "1",
      description: "Good",
      amount: 1000,
      payerId: "alice",
      participantIds: ["alice", "bob"],
      splitMethod: "equal",
    };

    expect(validateExpense(expense)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats cents as dollars", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(-567)).toBe("-$5.67");
  });
});

describe("getPersonName", () => {
  const people: Person[] = [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
  ];

  it("returns name when person exists", () => {
    expect(getPersonName(people, "alice")).toBe("Alice");
  });

  it("returns id when person not found", () => {
    expect(getPersonName(people, "carol")).toBe("carol");
  });
});
