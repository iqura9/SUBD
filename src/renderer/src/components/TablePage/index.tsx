import api from '@renderer/api'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useParams } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'

const fetchTableDetails = async (dbId: string, tableId: string) => {
  const { data } = await api.get(`/api/databases/${dbId}/tables/${tableId}`)
  return data
}

const TablePage: React.FC = () => {
  const { dbId, tableId } = useParams<{ dbId: string; tableId: string }>()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['table', dbId, tableId],
    queryFn: () => fetchTableDetails(dbId!, tableId!),
    enabled: !!dbId && !!tableId
  })

  if (isLoading) return <div>Loading table details...</div>
  if (isError) return <div>Error loading table details: {error.message}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Table Details</h2>

      <Table>
        <TableCaption>Table name: {data.table.name}.</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Column Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Primary Key</TableHead>
            <TableHead>Not Null</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.columns?.map((column: any) => (
            <TableRow key={column.cid}>
              <TableCell>{column.name}</TableCell>
              <TableCell>{column.type}</TableCell>
              <TableCell>{column.pk ? 'Yes' : 'No'}</TableCell>
              <TableCell>{column.notnull ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TablePage
