import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MergeButton from './index' // Adjust the import path as necessary

describe('MergeButton', () => {
  it('should merge tables successfully', async () => {
    render(<MergeButton currentDbId="1" currentTableId="1" selectedDbId="1" selectedTableId="2" />)

    // Simulate a click on the button
    fireEvent.click(screen.getByText('Merge Tables'))

    // Check for loading state
    expect(screen.getByText('Merging...')).toBeInTheDocument()

    // Await for success message (you may need to adjust based on your mock)
    await screen.findByText('Tables merged successfully!') // Adjust based on your success message
  })

  it('should handle errors', async () => {
    // Mock the API call to throw an error
    // vi.mock or a similar approach to trigger error handling

    render(<MergeButton currentDbId="1" currentTableId="1" selectedDbId="1" selectedTableId="2" />)

    fireEvent.click(screen.getByText('Merge Tables'))

    // Check for error alert
    await screen.findByText(/Error merging tables:/) // Adjust based on your error message
  })
})
