export const NANOS_PER_UNIT = 1_000_000_000;

export class Money {
  // The whole units of an amount of money (e.g. the $1 in $1.50)
  units: number;

  // The partial nano units of an amount of money (e.g. the $0.50, or 50M nanos,
  // in $1.50)
  nanos: number;

  constructor(units: number, nanos: number) {
    this.units = units;
    this.nanos = nanos;
  }

  valid(): boolean {
    return (
      // components must be integers
      (Number.isInteger(this.units) &&
        Number.isInteger(this.nanos) &&
        // nanos must be within range
        Math.abs(this.nanos) < NANOS_PER_UNIT &&
        // component signs must match
        !(
          (this.nanos < 0 && this.units > 0) ||
          (this.nanos > 0 && this.units < 0)
        ) &&
        // negative zeros must be rejected
        !Object.is(this.units, -0) &&
        !Object.is(this.nanos, -0)) ||
      // "positive" zeros are valid
      (Object.is(this.units, 0) && Object.is(this.nanos, 0))
    );
  }

  neg(): Money {
    return new Money(-this.units + 0, -this.nanos + 0);
  }

  abs(): Money {
    return new Money(Math.abs(this.units), Math.abs(this.nanos));
  }

  static cmp(a: Money, b: Money): number {
    if (a.units === b.units) {
      return a.nanos - b.nanos;
    }
    return a.units - b.units;
  }

  static add(a: Money, b: Money): Money {
    let units = a.units + b.units;
    let nanos = a.nanos + b.nanos;

    if (nanos >= NANOS_PER_UNIT || (units < 0 && nanos > 0)) {
      // nano overflows into units:
      units += 1;
      nanos -= NANOS_PER_UNIT;
    } else if (nanos <= -NANOS_PER_UNIT || (units > 0 && nanos < 0)) {
      // nano underflows into units:
      units -= 1;
      nanos += NANOS_PER_UNIT;
    }

    // add 0 to avoid components being set to -0
    return new Money(units + 0, nanos + 0);
  }

  static sub(a: Money, b: Money): Money {
    return Money.add(a, b.neg());
  }

  static mulFixed(a: Money, nanos: number): Money {
    const totalNanos = Math.round(
      ((a.units * NANOS_PER_UNIT + a.nanos) * nanos) / NANOS_PER_UNIT,
    );
    const units = Math.trunc(totalNanos / NANOS_PER_UNIT);
    const nanosResult = totalNanos % NANOS_PER_UNIT;

    // add 0 to avoid components being set to -0
    return new Money(units + 0, nanosResult + 0);
  }

  static mul(a: Money, factor: number): Money {
    return Money.mulFixed(a, floatToNanos(factor));
  }

  static divFixed(a: Money, nanos: number): Money {
    if (nanos === 0) {
      throw new RangeError("Cannot divide Money by zero");
    }

    const totalNanos = Math.round(
      ((a.units * NANOS_PER_UNIT + a.nanos) * NANOS_PER_UNIT) / nanos,
    );
    const units = Math.trunc(totalNanos / NANOS_PER_UNIT);
    const nanosResult = totalNanos % NANOS_PER_UNIT;

    // add 0 to avoid components being set to -0
    return new Money(units + 0, nanosResult + 0);
  }

  static div(a: Money, divisor: number): Money {
    return Money.divFixed(a, floatToNanos(divisor));
  }

  static parse(value: string): Money | null {
    const moneyRegex = /^-?(\d+|\d+\.\d+)$/;
    if (!moneyRegex.test(value)) {
      return null;
    }

    const [unitsStr, nanosStr] = value.split(".");
    const units =
      unitsStr === undefined || unitsStr === "" ? 0 : parseInt(unitsStr);
    const nanos =
      nanosStr === undefined || nanosStr === ""
        ? 0
        : parseInt(nanosStr.padEnd(9, "0"));

    return new Money(units, nanos);
  }
}

function floatToNanos(float: number): number {
  return Math.floor(float * NANOS_PER_UNIT);
}
