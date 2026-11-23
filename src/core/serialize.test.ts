import { describe, expect, it } from "vitest";
import { deserializeLedger, serializeLedger } from "./serialize";
import type { Ledger } from "./types";

const sampleLedger: Ledger = {
  people: [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ],
  expenses: [
    {
      id: "exp-1",
      description: "Dinner",
      amount: 10000,
      payerId: "1",
      participantIds: ["1", "2"],
      splitMethod: "equal",
    },
  ],
};

describe("serializeLedger", () => {
  it("returns a URL-safe base64 string", () => {
    const serialized = serializeLedger(sampleLedger);

    expect(serialized).not.toContain("+");
    expect(serialized).not.toContain("/");
    expect(serialized).not.toContain("=");
  });

  it("serializes an empty ledger", () => {
    const emptyLedger: Ledger = { people: [], expenses: [] };
    const serialized = serializeLedger(emptyLedger);

    expect(serialized.length).toBeGreaterThan(0);
  });

  it("handles unicode characters in names and descriptions", () => {
    const ledger: Ledger = {
      people: [{ id: "1", name: "田中" }],
      expenses: [
        {
          id: "exp-1",
          description: "寿司 🍣",
          amount: 5000,
          payerId: "1",
          participantIds: ["1"],
          splitMethod: "equal",
        },
      ],
    };

    expect(() => serializeLedger(ledger)).not.toThrow();
  });
});

describe("deserializeLedger", () => {
  it("round-trips a ledger through serialization", () => {
    const serialized = serializeLedger(sampleLedger);
    const deserialized = deserializeLedger(serialized);

    expect(deserialized).toEqual(sampleLedger);
  });

  it("round-trips an empty ledger", () => {
    const emptyLedger: Ledger = { people: [], expenses: [] };
    const serialized = serializeLedger(emptyLedger);
    const deserialized = deserializeLedger(serialized);

    expect(deserialized).toEqual(emptyLedger);
  });

  it("round-trips unicode characters", () => {
    const ledger: Ledger = {
      people: [{ id: "1", name: "田中" }],
      expenses: [
        {
          id: "exp-1",
          description: "寿司 🍣",
          amount: 5000,
          payerId: "1",
          participantIds: ["1"],
          splitMethod: "equal",
        },
      ],
    };

    const serialized = serializeLedger(ledger);
    const deserialized = deserializeLedger(serialized);

    expect(deserialized).toEqual(ledger);
  });

  it("round-trips an itemized ledger with fees", () => {
    const ledger: Ledger = {
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ],
      expenses: [
        {
          id: "exp-1",
          description: "Dinner",
          amount: 12875,
          payerId: "1",
          participantIds: ["1", "2"],
          splitMethod: "itemized",
          items: [
            {
              id: "item-1",
              description: "Burger",
              amount: 1500,
              consumerIds: ["1"],
            },
          ],
          fees: [
            {
              id: "fee-1",
              description: "Tax",
              type: "rate",
              value: 0.0875,
            },
          ],
        },
      ],
    };

    const serialized = serializeLedger(ledger);
    const deserialized = deserializeLedger(serialized);

    expect(deserialized).toEqual(ledger);
  });

  it("throws when given invalid input", () => {
    expect(() => deserializeLedger("not-valid-base64!!!")).toThrow();
  });
});
