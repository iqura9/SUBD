import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger
} from '@radix-ui/react-context-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'
import { useState } from 'react'
import 'tailwindcss/tailwind.css'

interface Database {
  id: number
  name: string
  tables: string[]
}

interface CreateDatabaseResponse {
  id: number
  name: string
}

interface CreateTableRequest {
  dbId: number
  tableName: string
}

const Sidebar = () => {
  const [databases, setDatabases] = useState<Database[]>([])
  const [dbCounter, setDbCounter] = useState(1)
  const queryClient = useQueryClient()

  // Mutation for creating a database
  const createDatabaseMutation = useMutation<
    AxiosResponse<CreateDatabaseResponse>,
    unknown,
    string
  >({
    mutationFn: (name: string) => axios.post('/api/databases', { name }),
    onSuccess: () => {
      setDbCounter((prev) => prev + 1)
      queryClient.invalidateQueries(['databases'])
    }
  })

  // Mutation for creating a table
  const createTableMutation = useMutation<AxiosResponse<void>, unknown, CreateTableRequest>({
    mutationFn: ({ dbId, tableName }: CreateTableRequest) =>
      axios.post(`/api/databases/${dbId}/tables`, { name: tableName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['databases'])
    }
  })

  const addDatabase = async (name: string) => {
    await createDatabaseMutation.mutateAsync(name)
    setDatabases((prev) => [...prev, { id: dbCounter, name, tables: [] }])
  }

  const addTable = async (dbId: number, tableName: string) => {
    await createTableMutation.mutateAsync({ dbId, tableName })
    setDatabases((prev) =>
      prev.map((db) => (db.id === dbId ? { ...db, tables: [...db.tables, tableName] } : db))
    )
  }

  const handleDatabaseCreate = () => {
    const dbName = prompt('Enter Database Name:')
    if (dbName) {
      addDatabase(dbName)
    }
  }

  const handleTableCreate = (dbId: number) => {
    const tableName = prompt('Enter Table Name:')
    if (tableName) {
      addTable(dbId, tableName)
    }
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-gray-800 text-white p-4">
        {/* Root folder */}
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="cursor-pointer p-2 hover:bg-gray-600 rounded-md">Root Folder</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem onSelect={handleDatabaseCreate}>Create Database</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Display databases */}
        <ul className="pl-4 mt-4">
          {databases.map((db) => (
            <li key={db.id}>
              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="cursor-pointer p-2 hover:bg-gray-600 rounded-md">{db.name}</div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Actions</ContextMenuLabel>
                  <ContextMenuItem onSelect={() => handleTableCreate(db.id)}>
                    Create Table
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {/* Display tables inside the database */}
              <ul className="pl-4">
                {db.tables.map((table, index) => (
                  <li key={index} className="p-1 text-gray-300">
                    {table}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
