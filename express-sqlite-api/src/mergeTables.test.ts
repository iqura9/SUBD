import request from 'supertest'
import app from './server'

jest.mock('sqlite3', () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn((callback) => callback()), // Mock close method
    serialize: jest.fn((cb) => cb())
  }
  return { Database: jest.fn(() => mockDb) }
})

let db: any

// Mock SQLite database setup
const setupDatabase = () => {
  db = new (require('sqlite3').Database)(':memory:')

  // Mock the methods
  db.run.mockImplementation((sql: string, params: any[], callback: Function) => {
    if (sql.startsWith('CREATE TABLE')) {
      callback(null)
    } else if (sql.startsWith('INSERT')) {
      callback(null)
    } else {
      callback(new Error('SQL not recognized'))
    }
  })

  db.get.mockImplementation((sql: string, params: any[], callback: Function) => {
    callback(null, { id: 1, name: 'TestDatabase' }) // Example response
  })

  db.all.mockImplementation((sql: string, params: any[], callback: Function) => {
    if (sql.includes('databases')) {
      callback(null, [{ id: 1, name: 'TestDatabase' }]) // Example response for all databases
    } else {
      callback(new Error('SQL not recognized'))
    }
  })
}

const closeDatabase = () => {
  return new Promise<void>((resolve) => {
    if (db && db.close) {
      db.close(() => {
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

  it.only('should merge tables successfully', async () => {
    // Setup: Create test databases and tables
    const db1Response = await request(app).post('/api/databases').send({ name: 'IquraDb' })
    const db2Response = await request(app).post('/api/databases').send({ name: 'RootDb' })

    const db1Id = db1Response.body.id
    const db2Id = db2Response.body.id

    console.log('db1Response.body', db1Response.body)
    console.log('db2Response.body', db2Response.body)

    // Create tables in the databases
    const table1Response = await request(app)
      .post(`/api/databases/${db1Id}/tables`)
      .send({ name: 'Table1' })
    const table2Response = await request(app)
      .post(`/api/databases/${db2Id}/tables`)
      .send({ name: 'Table2' })

    const table1Id = table1Response.body.id
    const table2Id = table2Response.body.id

    // Mock the responses for inserting columns and rows
    db.run.mockImplementationOnce((sql: string, params: any[], callback: Function) => {
      callback(null)
    })

    // Insert rows into both tables (mocked responses)
    db.run.mockImplementationOnce((sql: string, params: any[], callback: Function) => {
      callback(null)
    })

    db.run.mockImplementationOnce((sql: string, params: any[], callback: Function) => {
      callback(null)
    })

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
      { data: 'Row2' },
      { data: 'Row3' }
    ])
  })
})
