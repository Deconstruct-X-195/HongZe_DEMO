import type { Contract, ContractStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genContractId = () => genId('ctr')

export const listContracts = (): Contract[] =>
  read<Contract>(KEYS.contracts).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getContract = (id: string): Contract | undefined =>
  read<Contract>(KEYS.contracts).find((c) => c.id === id)

export const upsertContract = (contract: Contract): void => {
  const list = read<Contract>(KEYS.contracts)
  const idx = list.findIndex((c) => c.id === contract.id)
  if (idx >= 0) list[idx] = contract
  else list.push(contract)
  write(KEYS.contracts, list)
}

export const deleteContract = (id: string): void => {
  write(KEYS.contracts, read<Contract>(KEYS.contracts).filter((c) => c.id !== id))
}

export const updateContractStatus = (id: string, status: ContractStatus): void => {
  const c = getContract(id)
  if (c) {
    c.status = status
    c.updatedAt = new Date().toISOString()
    upsertContract(c)
  }
}
