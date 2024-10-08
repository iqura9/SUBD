import cors from 'cors'
import express, { Request, Response } from 'express'
import path from 'path'
import sqlite3 from 'sqlite3'

// Create the express application
const app = express()
const PORT = 5001

// Middleware
app.use(express.json())
app.use(cors())

app.options('*', cors())

// Connect to SQLite database (file-based)
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message)
  } else {
    console.log('Connected to the SQLite database.')

    // Create "databases" and "tables" tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS databases (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT UNIQUE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dbId INTEGER,
        FOREIGN KEY (dbId) REFERENCES databases(id)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        tableId INTEGER,
        FOREIGN KEY (tableId) REFERENCES tables(id)
    )`)
  }
})

// Get all databases
app.get('/api/databases', (req: Request, res: Response) => {
  const getDatabasesQuery = `SELECT * FROM databases`

  db.all(getDatabasesQuery, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving databases', details: err.message })
    }

    if (rows.length === 0) {
      return res.status(200).json({ databases: [] })
    }

    return res.status(200).json({ databases: rows })
  })
})

// Create a new database
app.post('/api/databases', (req: Request, res: Response) => {
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Database name is required' })
  }

  const insertDbQuery = `INSERT INTO databases (name) VALUES (?)`

  db.run(insertDbQuery, [name], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    return res.status(201).json({ message: 'Database created', id: this.lastID })
  })
})

app.get('/api/databases/:dbId/tables', (req: Request<{ dbId: string }>, res: Response) => {
  const { dbId } = req.params

  // SQL query to select all tables for the given database ID
  const getTablesQuery = `SELECT * FROM tables WHERE dbId = ?`

  // Execute the query
  db.all(getTablesQuery, [dbId], (err, rows) => {
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

// Get table in a specific database
app.get(
  '/api/databases/:dbId/tables/:tableId',
  (req: Request<{ dbId: string; tableId: string }>, res: Response) => {
    const { dbId, tableId } = req.params

    const getTableQuery = `SELECT * FROM tables WHERE dbId = ? AND id = ?`

    db.get(getTableQuery, [dbId, tableId], (err, tableData: { name: string }) => {
      if (err) {
        return res.status(500).json({ error: 'Error retrieving table', details: err.message })
      }

      if (!tableData) {
        return res.status(404).json({ error: 'Table not found' })
      }

      // If table is found, now get the column information
      const getColumnsQuery = `PRAGMA table_info(${tableData.name})`

      db.all(getColumnsQuery, [], (columnErr, columns) => {
        if (columnErr) {
          return res
            .status(500)
            .json({ error: 'Error retrieving columns', details: columnErr.message })
        }

        // Now get the rows from the table
        const getRowsQuery = `SELECT * FROM "${tableData.name}"` // Use double quotes to avoid syntax errors

        db.all(getRowsQuery, [], (rowErr, rows) => {
          if (rowErr) {
            return res.status(500).json({ error: 'Error retrieving rows', details: rowErr.message })
          }

          // Return both table details, columns, and rows
          return res.status(200).json({ table: tableData, columns, rows })
        })
      })
    })
  }
)

app.post('/api/databases/:dbId/tables', (req: Request<{ dbId: string }>, res: Response) => {
  const { dbId } = req.params
  const { columns, name: tableName } = req.body

  // Validate input
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return res.status(400).json({ error: 'Column definitions are required.' })
  }

  if (!tableName) {
    return res.status(400).json({ error: 'Table name is required.' })
  }

  // Step 1: Insert the table metadata into the "tables" table
  const insertTableQuery = `INSERT INTO tables (name, dbId) VALUES (?, ?)`
  db.run(insertTableQuery, [tableName, dbId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to save table metadata.', details: err.message })
    }

    const tableId = this.lastID // Get the inserted table's ID for use in the columns table

    columns.unshift({
      name: 'id',
      type: 'INTEGER PRIMARY KEY AUTOINCREMENT'
    })

    // Step 2: Dynamically create the table with the column definitions
    const columnDefinitions = columns
      .map((column) => {
        const { name, type } = column
        if (!name || !type) {
          throw new Error('Column name and type are required.')
        }

        // Wrap column names in double quotes to handle special characters or names starting with numbers
        return `"${name}" ${type.toUpperCase()}`
      })
      .join(', ')

    const createTableQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefinitions})`

    db.run(createTableQuery, [], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      // Step 3: Insert column metadata into the "columns" table
      const insertColumnQuery = `INSERT INTO columns (name, type, tableId) VALUES (?, ?, ?)`

      const columnInsertions = columns.map((column) => {
        const { name, type } = column
        return new Promise<void>((resolve, reject) => {
          db.run(insertColumnQuery, [name, type, tableId], (err) => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        })
      })

      // Wait for all column insertions to finish
      Promise.all(columnInsertions)
        .then(() =>
          res
            .status(201)
            .json({ message: 'Table and columns created successfully', tableName, dbId })
        )
        .catch((err) =>
          res.status(500).json({ error: 'Failed to save column metadata.', details: err.message })
        )
    })
  })
})

app.post(
  '/api/databases/:dbId/tables/:tableId/rows',
  (req: Request<{ dbId: string; tableId: string }>, res: Response) => {
    const { dbId, tableId } = req.params
    const data = req.body // Expecting an object with column-value pairs

    // Check if the table exists in the specific database
    db.get(
      `SELECT name FROM tables WHERE dbId=? AND id=? `,
      [dbId, tableId],
      (err, row: { name: string }) => {
        if (err || !row) {
          return res.status(404).json({ error: 'Table not found' })
        }
        const tableName = row.name
        // Prepare the insert query with parameterized values
        const columns = Object.keys(data)
          .map((col) => `"${col}"`)
          .join(', ')
        const placeholders = Object.keys(data)
          .map(() => '?')
          .join(', ')
        const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`

        // Use an array of values to safely bind to the query
        const values = Object.values(data)

        db.run(insertQuery, values, function (err) {
          if (err) {
            console.error('Error during insertion:', err)
            return res.status(500).json({ error: 'Error inserting data', details: err.message })
          }
          return res.status(201).json({ message: 'Data inserted successfully', id: this.lastID }) // Include the ID of the new row
        })
      }
    )
  }
)

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
