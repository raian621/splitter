import { describe, expect, it } from "vitest";
import { settleDebts } from "./settlement";
import type { Balance } from "./types";
import { Money } from "./money";

describe("settleDebts", () => {
  it("returns empty array when no balances", () => {
    expect(settleDebts([])).toEqual([]);
  });

  it("returns empty array when all balances are zero", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: Money.ZERO() },
      { personId: "bob", amount: Money.ZERO() },
    ];

    expect(settleDebts(balances)).toEqual([]);
  });

  it("settles a simple two-person debt", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: Money.parse("50")! },
      { personId: "bob", amount: Money.parse("-50")! },
    ];

    expect(settleDebts(balances)).toEqual([
      { from: "bob", to: "alice", amount: 5000 },
    ]);
  });

  it("settles debts among multiple people with minimal transactions", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: Money.parse("30")! },
      { personId: "bob", amount: Money.parse("20")! },
      { personId: "carol", amount: Money.parse("-40")! },
      { personId: "dave", amount: Money.parse("-10")! },
    ];

    const transactions = settleDebts(balances);

    // Total transferred equals total positive balance
    const totalTransferred = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferred).toBe(5000);

    // Each debtor pays out their full debt
    expect(transactions).toEqual(
      expect.arrayContaining([
        { from: "carol", to: "alice", amount: 3000 },
        { from: "carol", to: "bob", amount: 1000 },
        { from: "dave", to: "bob", amount: 1000 },
      ]),
    );
  });

  it("handles partial settlements between a large creditor and multiple debtors", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: Money.parse("100.00")! },
      { personId: "bob", amount: Money.parse("-30.00")! },
      { personId: "carol", amount: Money.parse("-20.00")! },
      { personId: "dave", amount: Money.parse("-50.00")! },
    ];

    const transactions = settleDebts(balances);

    const totalTransferred = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferred).toBe(10000);

    expect(transactions).toEqual(
      expect.arrayContaining([
        { from: "bob", to: "alice", amount: 3000 },
        { from: "carol", to: "alice", amount: 2000 },
        { from: "dave", to: "alice", amount: 5000 },
      ]),
    );
  });

  it("does not mutate original balances", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: Money.parse("10.00")! },
      { personId: "bob", amount: Money.parse("-10.00")! },
    ];

    settleDebts(balances);

    expect(balances[0].amount).toEqual(Money.parse("10.00"));
    expect(balances[1].amount).toEqual(Money.parse("-10.00"));
  });
});
