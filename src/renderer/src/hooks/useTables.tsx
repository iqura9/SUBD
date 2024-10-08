import api from '@renderer/api'
import { useQuery } from '@tanstack/react-query'

const fetchTables = async (dbId: string) => {
  const { data } = await api.get(`/api/databases/${dbId}/tables`)
  return data.tables
}

export const useTables = (dbId: string) => {
  return useQuery({
    queryKey: ['tables', dbId],
    queryFn: () => fetchTables(dbId),
    enabled: !!dbId
  })
}
