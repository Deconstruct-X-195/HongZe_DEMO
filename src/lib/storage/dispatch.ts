import type { Dispatch, DispatchStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genDispatchId = () => genId('dsp')

export const listDispatches = (): Dispatch[] =>
  read<Dispatch>(KEYS.dispatches).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getDispatch = (id: string): Dispatch | undefined =>
  read<Dispatch>(KEYS.dispatches).find((d) => d.id === id)

export const upsertDispatch = (dispatch: Dispatch): void => {
  const list = read<Dispatch>(KEYS.dispatches)
  const idx = list.findIndex((d) => d.id === dispatch.id)
  if (idx >= 0) list[idx] = dispatch
  else list.push(dispatch)
  write(KEYS.dispatches, list)
}

export const deleteDispatch = (id: string): void => {
  write(KEYS.dispatches, read<Dispatch>(KEYS.dispatches).filter((d) => d.id !== id))
}

export const updateDispatchStatus = (id: string, status: DispatchStatus): void => {
  const d = getDispatch(id)
  if (d) {
    d.status = status
    d.updatedAt = new Date().toISOString()
    upsertDispatch(d)
  }
}
