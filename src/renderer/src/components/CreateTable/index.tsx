// components/CreateTable.tsx
import api from '@renderer/api'
import { useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const CreateTable: React.FC<{ dbId: number }> = ({ dbId }) => {
  const [columns, setColumns] = useState<{ name: string; type: string }[]>([{ name: '', type: '' }])
  const [name, setName] = useState('')

  const handleColumnChange = (index: number, field: 'name' | 'type', value: string) => {
    const newColumns = [...columns]
    newColumns[index][field] = value
    setColumns(newColumns)
  }

  const addColumn = () => {
    setColumns([...columns, { name: '', type: '' }])
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const createTableMutation = useMutation({
    mutationFn: () => api.post(`/api/databases/${dbId}/tables`, { columns, name }),
    onSuccess: () => {
      alert('Table created successfully!')
      // Optionally, you could trigger a refetch of data or redirect the user here
    },
    onError: (error: any) => {
      console.error('Error creating table:', error)
      alert('Error creating table: ' + error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTableMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create a New Table</h2>
      <Input
        placeholder="Table Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="mb-4"
      />
      {columns.map((column, index) => (
        <div key={index} className="flex gap-3">
          <Input
            placeholder="Column Name"
            value={column.name}
            onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
            required
          />

          <Select
            onValueChange={(value) => handleColumnChange(index, 'type', value)}
            value={column.type}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="integer">Integer</SelectItem>
              <SelectItem value="real">Real</SelectItem>
              <SelectItem value="char">Char</SelectItem>
              <SelectItem value="string">String</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => removeColumn(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addColumn} className="mt-2">
        Add Column
      </Button>
      <Button type="submit" disabled={createTableMutation.isLoading} className="ml-2">
        {createTableMutation.isLoading ? 'Creating...' : 'Create Table'}
      </Button>
      {createTableMutation.isError && (
        <div className="text-red-500">
          Error creating table: {createTableMutation.error.message}
        </div>
      )}
    </form>
  )
}
const CreateTablePage = () => {
  const { dbId } = useParams()
  return <CreateTable dbId={Number(dbId)} />
}

export default CreateTablePage
