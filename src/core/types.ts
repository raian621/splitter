import type { Money } from "./money";

export type Person = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  description: string;
  amount: Money;
  consumerIds: string[]; // people who got this item
};

export type Fee = {
  id: string;
  description: string;
  type: "rate" | "amount";
  rate?: number;
  amount?: Money;
};

export type SplitMethod = "equal" | "itemized";

export type Expense = {
  id: string;
  description: string;
  amount: number; // amount in cents
  payerId: string;
  participantIds: string[]; // for equal split
  splitMethod: SplitMethod;
  items?: Item[]; // for itemized split
  fees?: Fee[]; // for itemized split
};

export type Balance = {
  personId: string;
  amount: Money; // positive = owed money, negative = owes money
};

export type Transaction = {
  from: string; // personId who pays
  to: string; // personId who receives
  amount: number; // always positive, in cents
};

// Holds the initial state of the expenses between parties.
export type Ledger = {
  people: Person[]; // The parties involved,
  expenses: Expense[]; // The expenses owed between parties.
};
