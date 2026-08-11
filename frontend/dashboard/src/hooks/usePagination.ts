import { useEffect, useMemo, useState } from 'react'

export const GRID_PAGE_SIZE = 10

export function usePagination<T>(items: T[], pageSize = GRID_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return { page, pageCount, pageSize, pagedItems, setPage }
}
