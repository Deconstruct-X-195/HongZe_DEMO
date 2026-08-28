import type { Customer } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genCustomerId = () => genId('cust')

export const listCustomers = (): Customer[] =>
  read<Customer>(KEYS.customers).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getCustomer = (id: string): Customer | undefined =>
  read<Customer>(KEYS.customers).find((c) => c.id === id)

export const upsertCustomer = (customer: Customer): void => {
  const list = read<Customer>(KEYS.customers)
  const idx = list.findIndex((c) => c.id === customer.id)
  if (idx >= 0) list[idx] = customer
  else list.push(customer)
  write(KEYS.customers, list)
}

export const deleteCustomer = (id: string): void => {
  write(KEYS.customers, read<Customer>(KEYS.customers).filter((c) => c.id !== id))
}
