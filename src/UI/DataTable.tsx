import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

export type DataTableColumn<Row> = {
  key: string
  header: string
  render: (row: Row) => ReactNode
}

export function DataTable<Row>({
  label,
  rows,
  columns,
  rowKey,
  emptyTitle,
  emptyDescription,
}: {
  label: string
  rows: Row[]
  columns: DataTableColumn<Row>[]
  rowKey: (row: Row) => string | number
  emptyTitle: string
  emptyDescription?: string
}) {
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return (
    <div className="buyer-ui-table-region" role="region" aria-label={label} tabIndex={0}>
      <table className="buyer-ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
