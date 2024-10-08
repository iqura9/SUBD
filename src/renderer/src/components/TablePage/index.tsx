import api from '@renderer/api'

import { useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '@renderer/main'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

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

  const [rowData, setRowData] = useState<any>({})

  const mutation = useMutation({
    mutationFn: async (newRowData: any) => {
      await api.post(`/api/databases/${dbId}/tables/${tableId}/rows`, newRowData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['table', dbId, tableId])

      setRowData({})
    },
    onError: (error) => {
      console.error('Error inserting data:', error)
      alert('Error inserting data: ' + error.message)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const { name, value } = e.target
    const fieldValue = type === 'INTEGER' ? Number(value) : value
    setRowData((prevData) => ({ ...prevData, [name]: fieldValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      mutation.mutate(rowData)
      setRowData({})
    } catch (error) {
      console.error('Error inserting data:', error)
      alert('Error inserting data: ' + error.message)
    }
  }

  if (isLoading) return <div>Loading table details...</div>
  if (isError) return <div>Error loading table details: {error.message}</div>

  return (
    <div>
      <h2 className="font-bold text-2xl">Table Details</h2>
      <h3 className="font-bold text-lg">Table Name: {data.table.name}</h3>

      <Table>
        <TableHeader>
          <TableRow>
            {data.columns?.map((column: { name: string }) => (
              <TableHead key={column.name}>{column.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows?.map((row: any, rowIndex: number) => (
            <TableRow key={rowIndex}>
              {data.columns.map((column: { name: string }) => (
                <TableCell key={column.name}>{row[column.name]}</TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow>
            {data.columns?.map((column: { name: string; type: string }) => (
              <TableCell key={column.name}>
                <Input
                  type={column.type === 'INTEGER' ? 'number' : 'text'}
                  name={column.name}
                  value={rowData[column.name] || ''}
                  onChange={(e) => handleInputChange(e, column.type)}
                  placeholder={`Enter ${column.name}`}
                  required
                />
              </TableCell>
            ))}
            <TableCell>
              <Button type="submit" onClick={handleSubmit}>
                Save
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default TablePage
