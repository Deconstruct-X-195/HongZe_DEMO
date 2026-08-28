import type { Quote, QuoteStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genQuoteId = () => genId('qte')

export const listQuotes = (): Quote[] =>
  read<Quote>(KEYS.quotes).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getQuote = (id: string): Quote | undefined =>
  read<Quote>(KEYS.quotes).find((q) => q.id === id)

export const upsertQuote = (quote: Quote): void => {
  const list = read<Quote>(KEYS.quotes)
  const idx = list.findIndex((q) => q.id === quote.id)
  if (idx >= 0) list[idx] = quote
  else list.push(quote)
  write(KEYS.quotes, list)
}

export const deleteQuote = (id: string): void => {
  write(KEYS.quotes, read<Quote>(KEYS.quotes).filter((q) => q.id !== id))
}

export const updateQuoteStatus = (id: string, status: QuoteStatus): void => {
  const q = getQuote(id)
  if (q) {
    q.status = status
    q.updatedAt = new Date().toISOString()
    upsertQuote(q)
  }
}
