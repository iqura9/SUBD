import api from '@renderer/api'
import { useTables } from '@renderer/hooks/useTables'
import { queryClient } from '@renderer/main'
import { useMutation, useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import MergeButton from '../MergeButton'
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
  const [editRowData, setEditRowData] = useState<any>({})

  const [editCell, setEditCell] = useState<{ rowIndex: number; columnName: string } | null>(null)

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

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const { name, value } = e.target
    const fieldValue = type === 'INTEGER' ? Number(value) : value
    setEditRowData((prevData) => ({ ...prevData, [name]: fieldValue }))
  }

  const handleDoubleClick = (rowIndex: number, columnName: string, currentValue: any) => {
    if (columnName == 'id') return

    setEditCell({ rowIndex, columnName })
    setEditRowData((prevData) => ({ ...prevData, [columnName]: currentValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      mutation.mutate(rowData)
      setRowData({})
      setEditRowData({})
    } catch (error) {
      console.error('Error inserting data:', error)
      alert('Error inserting data: ' + error.message)
    }
  }

  const handleSaveEdit = async (rowId: number, columnName: string) => {
    const updatedRowData = { ...editRowData }
    try {
      await api.put(`/api/databases/${dbId}/tables/${tableId}/rows/${rowId}`, updatedRowData) // Update your API endpoint as necessary
      queryClient.invalidateQueries(['table', dbId, tableId])
    } catch (error) {
      console.error('Error updating data:', error)
      alert('Error updating data: ' + error.message)
    }
    setEditCell(null) // Exit edit mode
  }

  const handleDelete = async (rowId: number) => {
    try {
      await api.delete(`/api/databases/${dbId}/tables/${tableId}/rows/${rowId}`) // Update your API endpoint as necessary
      queryClient.invalidateQueries(['table', dbId, tableId])
    } catch (error) {
      console.error('Error updating data:', error)
      alert('Error updating data: ' + error.message)
    }
    setEditCell(null) // Exit edit mode
  }

  const { data: tables } = useTables('all')

  console.log(tables)

  if (isLoading) return <div>Loading table details...</div>
  if (isError) return <div>Error loading table details: {error.message}</div>

  return (
    <div>
      <h2 className="font-bold text-2xl">Table Details</h2>
      <h3 className="font-bold text-lg">Table Name: {data.table.name}</h3>
      <MergeButton currentDbId={''} currentTableId={''} selectedDbId={''} selectedTableId={''} />
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
              {data.columns.map((column: { name: string; type: string }) => (
                <TableCell
                  key={column.name}
                  onDoubleClick={() => handleDoubleClick(rowIndex, column.name, row[column.name])}
                >
                  {editCell?.rowIndex === rowIndex && editCell?.columnName === column.name ? (
                    <Input
                      type={column.type === 'INTEGER' ? 'number' : 'text'}
                      name={column.name}
                      value={editRowData[column.name] || ''}
                      onChange={(e) => handleEditInputChange(e, column.type)}
                      onBlur={() => handleSaveEdit(row.id, column.name)} // Save on blur
                      placeholder={`Enter ${column.name}`}
                    />
                  ) : (
                    row[column.name] // Display current value
                  )}
                </TableCell>
              ))}
              {editCell?.rowIndex === rowIndex ? (
                <Button onClick={() => handleDelete(row.id)}>Delete</Button>
              ) : null}
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
                  disabled={column.name === 'id'}
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
