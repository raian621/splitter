export type Person = {
  id: string
  name: string
}

export type SplitMethod = 'equal'

export type Expense = {
  id: string
  description: string
  amount: number // amount in cents
  payerId: string
  participantIds: string[]
  splitMethod: SplitMethod
}

export type Balance = {
  personId: string
  amount: number // positive = owed money, negative = owes money
}

export type Transaction = {
  from: string // personId who pays
  to: string // personId who receives
  amount: number // always positive, in cents
}
