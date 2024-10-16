import api from '@renderer/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import { useNavigate } from 'react-router-dom'
import 'tailwindcss/tailwind.css'
import TablesList from '../TablesList'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '../ui/context-menu'

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
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createDatabaseMutation = useMutation<
    AxiosResponse<CreateDatabaseResponse>,
    unknown,
    string
  >({
    mutationFn: (name: string) => api.post('/api/databases', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['databases'])
    }
  })

  const { data } = useQuery<{ databases: Database[] }>({
    queryKey: ['databases'],
    queryFn: () => api.get('/api/databases').then((response) => response.data)
  })

  const addDatabase = async (name: string) => {
    await createDatabaseMutation.mutateAsync(name)
  }

  const handleDatabaseCreate = () => {
    const dbName = prompt('Enter Database Name:')
    if (dbName) {
      addDatabase(dbName)
    }
  }

  const handleTableCreate = (dbId: number) => {
    navigate(`/databases/create-table/${dbId}`)
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
            <ContextMenuItem onSelect={handleDatabaseCreate}>Create Database</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Display databases */}
        <ul className="pl-4 mt-4">
          {data?.databases.map((db) => (
            <li key={db.id}>
              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="cursor-pointer p-2 hover:bg-gray-600 rounded-md">{db.name}</div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => handleTableCreate(db.id)}>
                    Create Table
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              <TablesList dbId={db.id} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
