import path from 'path'
import sqlite3 from 'sqlite3'

export const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'), (err) => {
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
