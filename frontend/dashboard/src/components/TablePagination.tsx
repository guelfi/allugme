type TablePaginationProps = {
  total: number
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

type PaginationIconProps = {
  direction: 'left' | 'right'
  double?: boolean
}

function PaginationIcon({ direction, double = false }: PaginationIconProps) {
  const paths = double
    ? ['M11 17l-5-5 5-5', 'M18 17l-5-5 5-5']
    : ['M15 18l-6-6 6-6']

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={direction === 'right' ? 'pagination-icon-right' : undefined}
    >
      {paths.map((path) => <path key={path} d={path} />)}
    </svg>
  )
}

export function TablePagination({
  total,
  page,
  pageCount,
  pageSize,
  onPageChange,
  itemLabel = 'registros',
}: TablePaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav className="table-pagination" aria-label="Paginação da tabela">
      <span>Total: {total} {itemLabel}</span>
      <span>Total: {first}-{last}/{total}</span>
      <button type="button" onClick={() => onPageChange(1)} disabled={page === 1} aria-label="Primeira página">
        <PaginationIcon direction="left" double />
      </button>
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Página anterior">
        <PaginationIcon direction="left" />
      </button>
      <span className="table-pagination-current" aria-current="page">{page}</span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label="Próxima página">
        <PaginationIcon direction="right" />
      </button>
      <button type="button" onClick={() => onPageChange(pageCount)} disabled={page === pageCount} aria-label="Última página">
        <PaginationIcon direction="right" double />
      </button>
    </nav>
  )
}
