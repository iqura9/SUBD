import cors from 'cors'
import express, { Request, Response } from 'express'
import { db } from './db'
import { createDatabaseEndpoint, createMergeEndpoint, getDatabaseEndpoint } from './endpoints'
import { getTablesInDb, postTables, postTablesRows } from './endpoints/table'

// Create the express application
const app = express()
const PORT = 5001

// Middleware
app.use(express.json())
app.use(cors())

app.options('*', cors())

getDatabaseEndpoint(app, db)
createDatabaseEndpoint(app, db)

app.get('/api/databases/:dbId/tables', (req: Request<{ dbId: string }>, res: Response) => {
  const { dbId } = req.params

  let getTablesQuery = `SELECT * FROM tables WHERE dbId = ?`
  let params = [dbId]
  if (dbId === 'all') {
    getTablesQuery = 'SELECT * FROM tables'
    params = []
  }
  // SQL query to select all tables for the given database ID

  // Execute the query
  db.all(getTablesQuery, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err) // Log the error for debugging
      return res.status(500).json({ error: 'Error retrieving tables', details: err.message })
    }

    // If no tables are found, return an empty array
    if (rows.length === 0) {
      return res.status(200).json({ tables: [] })
    }

    // If tables are found, return them as a response
    return res.status(200).json({ tables: rows })
  })
})

getTablesInDb(app, db)
postTables(app, db)
postTablesRows(app, db)

app.put(
  '/api/databases/:dbId/tables/:tableId/rows/:rowIndex',
  (req: Request<{ dbId: string; tableId: string; rowIndex: string }>, res: Response) => {
    const { dbId, tableId, rowIndex } = req.params
    const updatedData = req.body // Get the updated data from the request body

    // Assuming the table name is passed in the URL or obtained previously
    const getTableQuery = `SELECT name FROM tables WHERE dbId = ? AND id = ?`

    db.get(getTableQuery, [dbId, tableId], (err, tableData: { name: string }) => {
      if (err) {
        return res.status(500).json({ error: 'Error retrieving table', details: err.message })
      }

      if (!tableData) {
        return res.status(404).json({ error: 'Table not found' })
      }

      // Create the update query based on the updatedData object
      const columns = Object.keys(updatedData)
        .map((key) => `${key} = ?`)
        .join(', ')
      const values = Object.values(updatedData)

      // Construct the SQL query for updating the row
      const updateQuery = `UPDATE ${tableData.name} SET ${columns} WHERE id = ?`
      const params = [...values, rowIndex] // Assuming rowIndex corresponds to the row ID

      db.run(updateQuery, params, function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Error updating row', details: updateErr.message })
        }

        return res.status(200).json({ message: 'Row updated successfully' })
      })
    })
  }
)

// DELETE endpoint to delete a row in a specified table
app.delete(
  '/api/databases/:dbId/tables/:tableId/rows/:rowIndex',
  (req: Request<{ dbId: string; tableId: string; rowIndex: string }>, res: Response) => {
    const { dbId, tableId, rowIndex } = req.params

    // SQL query to get the table name
    const getTableQuery = `SELECT name FROM tables WHERE dbId = ? AND id = ?`

    db.get(getTableQuery, [dbId, tableId], (err, tableData: { name: string }) => {
      if (err) {
        return res.status(500).json({ error: 'Error retrieving table', details: err.message })
      }

      if (!tableData) {
        return res.status(404).json({ error: 'Table not found' })
      }

      // Construct the SQL query for deleting the row
      const deleteQuery = `DELETE FROM ${tableData.name} WHERE id = ?`

      db.run(deleteQuery, [rowIndex], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: 'Error deleting row', details: deleteErr.message })
        }

        // Assuming you have cascading delete constraints set up in your database
        return res.status(200).json({ message: 'Row deleted successfully' })
      })
    })
  }
)

createMergeEndpoint(app, db)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app
