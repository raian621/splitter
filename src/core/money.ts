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
}
