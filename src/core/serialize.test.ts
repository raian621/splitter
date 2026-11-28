import { describe, expect, it } from "vitest";
import { deserializeLedger, serializeLedger } from "./serialize";
import type { Ledger } from "./types";
import { Money } from "./money";

const sampleLedger: Ledger = {
  people: [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ],
  expenses: [
    {
      id: "exp-1",
      description: "Dinner",
      amount: Money.parse("100.00")!,
      payerId: "1",
      participantIds: ["1", "2"],
      splitMethod: "equal",
    },
  ],
};

describe("serializeLedger", () => {
  it("returns a URL-safe base64 string", async () => {
    const serialized = await serializeLedger(sampleLedger);

    expect(serialized).toBeTypeOf("string");
    expect(serialized).not.toContain("+");
    expect(serialized).not.toContain("/");
    expect(serialized).not.toContain("=");
  });

  it("serializes an empty ledger", async () => {
    const emptyLedger: Ledger = { people: [], expenses: [] };
    const serialized = await serializeLedger(emptyLedger);

    expect(serialized).toBeTypeOf("string");
    expect(serialized.length).toBeGreaterThan(0);
  });

  it("handles unicode characters in names and descriptions", async () => {
    const ledger: Ledger = {
      people: [{ id: "1", name: "田中" }],
      expenses: [
        {
          id: "exp-1",
          description: "寿司 🍣",
          amount: Money.parse("50.00")!,
          payerId: "1",
          participantIds: ["1"],
          splitMethod: "equal",
        },
      ],
    };

    await expect(serializeLedger(ledger)).resolves.not.toThrow();
  });
});

describe("deserializeLedger", () => {
  it("round-trips a ledger through serialization", async () => {
    const serialized = await serializeLedger(sampleLedger);
    const deserialized = await deserializeLedger(serialized);

    expect(deserialized).toEqual(sampleLedger);
  });

  it("round-trips an empty ledger", async () => {
    const emptyLedger: Ledger = { people: [], expenses: [] };
    const serialized = await serializeLedger(emptyLedger);
    const deserialized = await deserializeLedger(serialized);

    expect(deserialized).toEqual(emptyLedger);
  });

  it("round-trips unicode characters", async () => {
    const ledger: Ledger = {
      people: [{ id: "1", name: "田中" }],
      expenses: [
        {
          id: "exp-1",
          description: "寿司 🍣",
          amount: Money.parse("50.00")!,
          payerId: "1",
          participantIds: ["1"],
          splitMethod: "equal",
        },
      ],
    };

    const serialized = await serializeLedger(ledger);
    const deserialized = await deserializeLedger(serialized);

    expect(deserialized).toEqual(ledger);
  });

  it("round-trips an itemized ledger with fees", async () => {
    const ledger: Ledger = {
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ],
      expenses: [
        {
          id: "exp-1",
          description: "Dinner",
          amount: Money.parse("128.75")!,
          payerId: "1",
          participantIds: ["1", "2"],
          splitMethod: "itemized",
          items: [
            {
              id: "item-1",
              description: "Burger",
              amount: Money.parse("15.00")!,
              consumerIds: ["1"],
            },
          ],
          fees: [
            {
              id: "fee-1",
              description: "Tax",
              type: "rate",
              rate: 0.0875,
            },
          ],
        },
      ],
    };

    const serialized = await serializeLedger(ledger);
    const deserialized = await deserializeLedger(serialized);

    expect(deserialized).toEqual(ledger);
  });

  it("produces a smaller output than uncompressed JSON", async () => {
    const ledger: Ledger = {
      people: Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Person ${i}`,
      })),
      expenses: Array.from({ length: 20 }, (_, i) => ({
        id: `exp-${i}`,
        description: `Expense ${i} with a fairly long description`,
        amount: Money.parse("123.45")!,
        payerId: "1",
        participantIds: ["1", "2", "3"],
        splitMethod: "equal" as const,
      })),
    };

    const serialized = await serializeLedger(ledger);
    const uncompressed = JSON.stringify(ledger);

    expect(serialized.length).toBeLessThan(uncompressed.length);
  });

  it("throws when given invalid input", async () => {
    await expect(deserializeLedger("not-valid-base64!!!")).rejects.toThrow();
  });
});
