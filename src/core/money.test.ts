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

  describe("add", () => {
    it("should handle positive inputs", () => {
      expect(Money.add(new Money(1, 2), new Money(3, 4))).toEqual(
        new Money(4, 6),
      );
    });

    it("should handle nano overflow", () => {
      expect(Money.add(new Money(0, 999_999_999), new Money(0, 2))).toEqual(
        new Money(1, 1),
      );
    });

    it("should handle nano underflow", () => {
      expect(Money.add(new Money(1, 1), new Money(0, -2))).toEqual(
        new Money(0, 999_999_999),
      );
    });

    it("should handle negative result", () => {
      expect(Money.add(new Money(0, 1), new Money(0, -2))).toEqual(
        new Money(0, -1),
      );
    });

    it("should handle negative inputs", () => {
      expect(Money.add(new Money(-1, -2), new Money(-3, -4))).toEqual(
        new Money(-4, -6),
      );
    });

    it("should handle negative nano overflow", () => {
      expect(Money.add(new Money(0, -999_999_999), new Money(0, -2))).toEqual(
        new Money(-1, -1),
      );
    });

    it("should handle negative nano underflow", () => {
      expect(Money.add(new Money(-1, -1), new Money(0, 2))).toEqual(
        new Money(0, -999_999_999),
      );
    });
  });

  test("sub", () => {
    expect(Money.sub(new Money(3, 4), new Money(1, 2))).toEqual(
      new Money(2, 2),
    );
  });

  describe("mulFixed", () => {
    it("should multiply by a fixed point integer", () => {
      expect(
        Money.mulFixed(new Money(1, 500_000_000), 2 * NANOS_PER_UNIT),
      ).toEqual(new Money(3, 0));
      expect(Money.mulFixed(new Money(1, 0), 1_500_000_000)).toEqual(
        new Money(1, 500_000_000),
      );
    });

    it("should handle nano components and negative values", () => {
      expect(Money.mulFixed(new Money(1, 2), 3 * NANOS_PER_UNIT)).toEqual(
        new Money(3, 6),
      );
      expect(Money.mulFixed(new Money(-1, -2), 3 * NANOS_PER_UNIT)).toEqual(
        new Money(-3, -6),
      );
      expect(Money.mulFixed(new Money(1, 2), -3 * NANOS_PER_UNIT)).toEqual(
        new Money(-3, -6),
      );
    });

    it("should round sub-nano results and avoid negative zero", () => {
      const rounded = Money.mulFixed(new Money(0, 1), 500_000_000);
      expect(rounded).toEqual(new Money(0, 1));
      expect(rounded.valid()).toBe(true);

      const zero = Money.mulFixed(new Money(-1, 0), 0);
      expect(zero).toEqual(new Money(0, 0));
      expect(zero.valid()).toBe(true);
    });
  });

  test("mul", () => {
    expect(Money.mul(new Money(1, 0), 0.5)).toEqual(new Money(0, 500_000_000));
  });

  describe("divFixed", () => {
    it("should divide by a fixed point integer", () => {
      expect(Money.divFixed(new Money(1, 0), 2 * NANOS_PER_UNIT)).toEqual(
        new Money(0, 500_000_000),
      );
      expect(Money.divFixed(new Money(0, 500_000_000), 500_000_000)).toEqual(
        new Money(1, 0),
      );
    });

    it("should handle nano components and negative values", () => {
      expect(Money.divFixed(new Money(3, 6), 3 * NANOS_PER_UNIT)).toEqual(
        new Money(1, 2),
      );
      expect(Money.divFixed(new Money(-3, -6), 3 * NANOS_PER_UNIT)).toEqual(
        new Money(-1, -2),
      );
      expect(Money.divFixed(new Money(3, 6), -3 * NANOS_PER_UNIT)).toEqual(
        new Money(-1, -2),
      );
    });

    it("should round sub-nano results and avoid negative zero", () => {
      const rounded = Money.divFixed(new Money(0, 1), 2 * NANOS_PER_UNIT);
      expect(rounded).toEqual(new Money(0, 1));
      expect(rounded.valid()).toBe(true);

      const zero = Money.divFixed(new Money(0, 0), -2 * NANOS_PER_UNIT);
      expect(zero).toEqual(new Money(0, 0));
      expect(zero.valid()).toBe(true);
    });

    it("should throw when dividing by zero", () => {
      expect(() => Money.divFixed(new Money(1, 0), 0)).toThrow(RangeError);
      expect(() => Money.div(new Money(1, 0), 0)).toThrow(RangeError);
    });
  });

  test("div", () => {
    expect(Money.div(new Money(1, 0), 2)).toEqual(new Money(0, 500_000_000));
    expect(Money.div(new Money(1, 500_000_000), 0.5)).toEqual(new Money(3, 0));
  });

  describe("parse", () => {
    it("should parse whole inputs", () => {
      expect(Money.parse("4")).toEqual(new Money(4, 0));
      expect(Money.parse("-4")).toEqual(new Money(-4, 0));
    });

    it("should parse inputs with decimal components", () => {
      expect(Money.parse("1.67")).toEqual(new Money(1, 670_000_000));
    });

    it("should parse negative imputs", () => {
      expect(Money.parse("-1.67")).toEqual(new Money(-1, -670_000_000));
    });
  });
});
