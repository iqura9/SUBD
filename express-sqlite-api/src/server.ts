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
      name TEXT, 
      dbId INTEGER, 
      FOREIGN KEY (dbId) REFERENCES databases(id)
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
      return res.status(404).json({ message: 'No databases found' })
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

// Get tables in a specific database
app.get('/api/databases/:dbId/tables', (req: Request<{ dbId: string }>, res: Response) => {
  const { dbId } = req.params

  const getTablesQuery = `SELECT * FROM tables WHERE dbId = ?`

  db.all(getTablesQuery, [dbId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving tables', details: err.message })
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No tables found for this database' })
    }

    return res.status(200).json({ tables: rows })
  })
})

// Create a new table in a specific database
app.post('/api/databases/:dbId/tables', (req: Request<{ dbId: string }>, res: Response) => {
  const { dbId } = req.params
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Table name is required' })
  }

  const insertTableQuery = `INSERT INTO tables (name, dbId) VALUES (?, ?)`

  db.run(insertTableQuery, [name, dbId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    return res.status(201).json({ message: 'Table created', id: this.lastID })
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
