import api from '@renderer/api'
import { useMutation } from '@tanstack/react-query'
import React from 'react'
import { Button } from '../ui/button'

const MergeButton: React.FC<{
  currentDbId: string
  currentTableId: string
  selectedDbId: string
  selectedTableId: string
}> = ({ currentDbId, currentTableId, selectedDbId, selectedTableId }) => {
  const mergeTablesMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        `/api/databases/${currentDbId}/tables/${currentTableId}/merge/${selectedDbId}/${selectedTableId}`
      )
    },
    onSuccess: () => {
      alert('Tables merged successfully!')
      // Optionally, invalidate queries or refetch data here
    },
    onError: (error) => {
      console.error('Error merging tables:', error)
      alert('Error merging tables: ' + error.message)
    }
  })

  const handleMerge = () => {
    mergeTablesMutation.mutate()
  }

  return (
    <Button onClick={handleMerge} disabled={mergeTablesMutation.isLoading}>
      {mergeTablesMutation.isLoading ? 'Merging...' : 'Merge Tables'}
    </Button>
  )
}

export default MergeButton
