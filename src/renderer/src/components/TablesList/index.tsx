import { useTables } from '@renderer/hooks/useTables'
import React from 'react'
import { Link } from 'react-router-dom'

interface TablesListProps {
  dbId: string
}

const TablesList: React.FC<TablesListProps> = ({ dbId }) => {
  const { data: tables, isLoading, isError } = useTables(dbId)

  if (isLoading) return <></>
  if (isError) return <></>

  return (
    <div>
      {tables && tables.length > 0 ? (
        <ul className="pl-4">
          {tables.map((table: { id: number; name: string }) => (
            <li key={table.id} className="p-1 text-gray-300 cursor-pointer">
              <Link to={`/databases/${dbId}/tables/${table.id}`}>{table.name}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default TablesList
