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
      // Return a 500 response in case of an error
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

    // SQL query to get the table details from the 'tables' table
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

        // Return both table details and its columns
        return res.status(200).json({ table: tableData, columns })
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

    // Construct the INSERT INTO query
    const columns = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ')
    const values = Object.values(data)
      .map((value) => `"${value}"`)
      .join(', ')

    const insertQuery = `INSERT INTO "${tableId}" (${columns}) VALUES (${values})`

    db.run(insertQuery, [], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error inserting data', details: err.message })
      }
      return res.status(201).json({ message: 'Data inserted successfully' })
    })
  }
)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
