import sqlite3 from 'sqlite3'
import request from 'supertest'
import app from './server'

// Create a temporary database for testing
let db: sqlite3.Database

const setupDatabase = () => {
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening database:', err.message)
    }
  })

  // Setup initial tables
  db.serialize(() => {
    db.run('CREATE TABLE databases (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)')
    db.run(
      'CREATE TABLE tables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, databaseId INTEGER)'
    )
  })
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
      resolve() // Resolve immediately if db is not defined
    }
  })
}

beforeAll(() => {
  setupDatabase()
})

afterAll(async () => {
  await closeDatabase()
}, 10000) // Increase timeout if needed

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

    // Create tables in the databases
    const table1Response = await request(app)
      .post(`/api/databases/${db1Id}/tables`)
      .send({ name: 'Table1' })
    const table2Response = await request(app)
      .post(`/api/databases/${db2Id}/tables`)
      .send({ name: 'Table2' })

    const table1Id = table1Response.body.id
    const table2Id = table2Response.body.id

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
      `/api/databases/${db1Id}/tables/${table1Id}/rows`
    )
    expect(currentTableDataResponse.body).toEqual([
      { id: 1, data: 'Row1' },
      { id: 2, data: 'Row2' }
    ])
  })
})
