import { describe, expect, it, test } from "vitest";
import { Money, NANOS_PER_UNIT } from "./money";

describe("Money class tests", () => {
  describe("valid", () => {
    it("should return true if both components are positive and nanos is in range", () => {
      const money = new Money(1, 670_000_000); // 1.67

      expect(money.valid()).toBe(true);
    });

    it("should return true if both components are negative and nanos is in range", () => {
      const money = new Money(-1, -670_000_000); // 1.67

      expect(money.valid()).toBe(true);
    });

    it("should return false if nanos is out of range", () => {
      const outOfRangePos = new Money(1, NANOS_PER_UNIT);
      const outOfRangeNeg = new Money(-1, -NANOS_PER_UNIT);

      expect(
        outOfRangePos.valid(),
        "out of range positive nano validation failed",
      ).toBe(false);
      expect(
        outOfRangeNeg.valid(),
        "out of range negative nano validation failed",
      ).toBe(false);
    });

    it("should return false if component signs don't match", () => {
      const negUnitsPosNanos = new Money(-1, 1);
      const posUnitsNegNanos = new Money(1, -1);

      expect(negUnitsPosNanos.valid(), "negative units, positive nanos").toBe(
        false,
      );
      expect(posUnitsNegNanos.valid(), "positive units, negative nanos").toBe(
        false,
      );
    });

    it("should return false if there are negative zero components", () => {
      [
        [-0, 0],
        [0, -0],
        [-0, -0],
      ]
        .map(([units, nanos]) => new Money(units, nanos))
        .forEach((m) => {
          expect(m.valid(), `units: ${m.units}, nanos: ${m.nanos}`).toBe(false);
        });
    });

    it("should return false if there are non-integer components", () => {
      [
        [1.5, 0],
        [0, 1.5],
        [1.5, 1.5],
      ]
        .map(([units, nanos]) => new Money(units, nanos))
        .forEach((m) => {
          expect(m.valid(), `units: ${m.units}, nanos: ${m.nanos}`).toBe(false);
        });
    });

    it("should return true for zero Money", () => {
      expect(new Money(0, 0).valid()).toBe(true);
    });
  });

  describe("neg", () => {
    it("should return a valid Money with negated components", () => {
      const money = new Money(1, 67_000_000);
      const expected = new Money(-1, -67_000_000);
      const actual = money.neg();

      expect(actual.valid()).toBe(true);
      expect(actual).toEqual(expected);
    });

    it("should return 0 Money for 0 Money input", () => {
      const zeroMoney = new Money(0, 0);
      const actual = zeroMoney.neg();

      expect(actual).toEqual(zeroMoney);
      expect(actual.valid()).toBe(true);
    });
  });

  describe("cmp", () => {
    it("should order Money objects in ascending order", () => {
      const smallest = new Money(-1, -67_000_000);
      const middle = new Money(0, 0);
      const largest = new Money(1, 67_000_000);

      expect([largest, middle, smallest].sort(Money.cmp)).toEqual([
        smallest,
        middle,
        largest,
      ]);
    });
  });

  test("abs", () => {
    const negative = new Money(-1, -670_000_000);
    const positive = new Money(1, 670_000_000);

    expect(negative.abs()).toEqual(positive);
    expect(positive.abs()).toEqual(positive);
  });
});
