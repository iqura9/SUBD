import { Express, Request, Response } from 'express'
import { Database } from 'sqlite3'

export function postTablesRows(app: Express, db: Database) {
  return app.post(
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
}

export function postTables(app: Express, db: Database) {
  return app.post(
    '/api/databases/:dbId/tables',
    (req: Request<{ dbId: string }>, res: Response) => {
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
          return res
            .status(500)
            .json({ error: 'Failed to save table metadata.', details: err.message })
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
              res.status(201).json({
                message: 'Table and columns created successfully',
                tableName,
                dbId,
                tableId
              })
            )
            .catch((err) =>
              res
                .status(500)
                .json({ error: 'Failed to save column metadata.', details: err.message })
            )
        })
      })
    }
  )
}

export function getTablesInDb(app: Express, db: Database) {
  return app.get(
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
              return res
                .status(500)
                .json({ error: 'Error retrieving rows', details: rowErr.message })
            }

            // Return both table details, columns, and rows
            return res.status(200).json({ table: tableData, columns, rows })
          })
        })
      })
    }
  )
}
