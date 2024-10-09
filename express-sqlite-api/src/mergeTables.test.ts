import cors from 'cors'
import express from 'express'
import sqlite3 from 'sqlite3'
import request from 'supertest'

// Mock express app setup
const app = express()
app.use(express.json())
app.use(cors())

// Mock SQLite database
const db = new sqlite3.Database(':memory:') // Use in-memory database for testing

// Your original database schema and endpoints setup here
db.serialize(() => {
  // Create necessary tables for testing
  db.run(
    `CREATE TABLE IF NOT EXISTS databases (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`
  )
  db.run(
    `CREATE TABLE IF NOT EXISTS tables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, dbId INTEGER, FOREIGN KEY (dbId) REFERENCES databases(id))`
  )
  db.run(
    `CREATE TABLE IF NOT EXISTS columns (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, tableId INTEGER, FOREIGN KEY (tableId) REFERENCES tables(id))`
  )
})

// Define your endpoints (the same ones you defined in your server.ts)
app.get('/api/databases', (req, res) => {
  db.all(`SELECT * FROM databases`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving databases', details: err.message })
    }
    return res.status(200).json({ databases: rows })
  })
})

app.post('/api/databases', (req, res) => {
  const { name } = req.body
  const insertDbQuery = `INSERT INTO databases (name) VALUES (?)`
  db.run(insertDbQuery, [name], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    return res.status(201).json({ message: 'Database created', id: this.lastID })
  })
})

// Add more endpoints as necessary...

describe('Database API', () => {
  // Test case to get all databases
  it('should retrieve all databases', async () => {
    const response = await request(app).get('/api/databases')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('databases')
  })

  // Test case to create a new database
  it('should create a new database', async () => {
    const response = await request(app).post('/api/databases').send({ name: 'Test Database' })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('message', 'Database created')
  })

  // Add more test cases for other endpoints...
})

// Close the database after tests
afterAll((done) => {
  db.close()
  done()
})
