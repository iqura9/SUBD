import express from 'express'
import sqlite3 from 'sqlite3'
import request from 'supertest'
import { db } from './db'
import { createDatabaseEndpoint, createMergeEndpoint, getDatabaseEndpoint } from './endpoints'
import { getTablesInDb, postTables, postTablesRows } from './endpoints/table'

const app = express()
app.use(express.json())

const PORT = 5002

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

const setupDatabase = () => {
  const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message)
    } else {
      console.log('Connected to the SQLite database.')

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
  return db
}

const closeDatabase = () => {
  return new Promise<void>((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message)
        }
        resolve()
      })
    } else {
      resolve()
    }
  })
}

beforeAll(() => {
  const db = setupDatabase()
  createDatabaseEndpoint(app, db)
  getDatabaseEndpoint(app, db)
  postTablesRows(app, db)
  postTables(app, db)
  getTablesInDb(app, db)
  createMergeEndpoint(app, db)
})

afterAll(() => {
  closeDatabase()
  server.close()
})

describe('Database API', () => {
  it('should retrieve all databases', async () => {
    const response = await request(app).get('/api/databases')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('databases')
  })

  it('should create a new database', async () => {
    const response = await request(app).post('/api/databases').send({ name: 'TestDatabase' })
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('message', 'Database created')
  })

  it('should merge tables successfully', async () => {
    // Setup: Create test databases
    const db1Response = await request(app).post('/api/databases').send({ name: 'IquraDb' })
    const db2Response = await request(app).post('/api/databases').send({ name: 'RootDb' })

    const db1Id = db1Response.body.id
    const db2Id = db2Response.body.id

    console.log('db1Response.body', db1Response.body)
    console.log('db2Response.body', db2Response.body)

    // Create tables in the databases
    const table1Response = await request(app)
      .post(`/api/databases/${db1Id}/tables`)
      .send({
        columns: [
          {
            name: 'data',
            type: 'string'
          }
        ],
        name: 'Table1'
      })
    const table2Response = await request(app)
      .post(`/api/databases/${db2Id}/tables`)
      .send({
        columns: [
          {
            name: 'data',
            type: 'string'
          }
        ],
        name: 'Table2'
      })

    const table1Id = table1Response.body.tableId
    const table2Id = table2Response.body.tableId

    // Insert rows into both tables (mocked responses)
    await request(app)
      .post(`/api/databases/${db1Id}/tables/${table1Id}/rows`)
      .send({ data: 'Row1' })

    await request(app)
      .post(`/api/databases/${db2Id}/tables/${table2Id}/rows`)
      .send({ data: 'Row2' })

    // Mock the merge response
    const mergeResponse = await request(app).post(
      `/api/databases/${db1Id}/tables/${table1Id}/merge/${db2Id}/${table2Id}`
    )

    expect(mergeResponse.status).toBe(200)
    expect(mergeResponse.body).toHaveProperty('message', 'Tables merged successfully')

    // Verify the data was merged correctly
    const currentTableDataResponse = await request(app).get(
      `/api/databases/${db1Id}/tables/${table1Id}`
    )
    expect(currentTableDataResponse.body.rows).toEqual([
      { id: 1, data: 'Row1' },
      { id: 2, data: 'Row2' }
    ])
  })
})
