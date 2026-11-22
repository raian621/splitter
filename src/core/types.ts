export type Person = {
  id: string
  name: string
}

export type Item = {
  id: string
  description: string
  amount: number // amount in cents
  consumerIds: string[] // people who got this item
}

export type Fee = {
  id: string
  description: string
  type: 'rate' | 'amount'
  value: number // rate (e.g. 0.0875) or amount in cents
}

export type SplitMethod = 'equal' | 'itemized'

export type Expense = {
  id: string
  description: string
  amount: number // amount in cents
  payerId: string
  participantIds: string[] // for equal split
  splitMethod: SplitMethod
  items?: Item[] // for itemized split
  fees?: Fee[] // for itemized split
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
