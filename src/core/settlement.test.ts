import { describe, expect, it } from "vitest";
import { settleDebts } from "./settlement";
import type { Balance } from "./types";

describe("settleDebts", () => {
  it("returns empty array when no balances", () => {
    expect(settleDebts([])).toEqual([]);
  });

  it("returns empty array when all balances are zero", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: 0 },
      { personId: "bob", amount: 0 },
    ];

    expect(settleDebts(balances)).toEqual([]);
  });

  it("settles a simple two-person debt", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: 5000 },
      { personId: "bob", amount: -5000 },
    ];

    expect(settleDebts(balances)).toEqual([
      { from: "bob", to: "alice", amount: 5000 },
    ]);
  });

  it("settles debts among multiple people with minimal transactions", () => {
    const balances: Balance[] = [
      { personId: "alice", amount: 3000 },
      { personId: "bob", amount: 2000 },
      { personId: "carol", amount: -4000 },
      { personId: "dave", amount: -1000 },
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
      { personId: "alice", amount: 10000 },
      { personId: "bob", amount: -3000 },
      { personId: "carol", amount: -2000 },
      { personId: "dave", amount: -5000 },
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
      { personId: "alice", amount: 1000 },
      { personId: "bob", amount: -1000 },
    ];

    settleDebts(balances);

    expect(balances[0].amount).toBe(1000);
    expect(balances[1].amount).toBe(-1000);
  });
});
