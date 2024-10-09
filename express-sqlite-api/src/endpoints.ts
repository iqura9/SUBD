import { Express, Request, Response } from 'express'
import { Database } from 'sqlite3'

export function createMergeEndpoint(app: Express, db: Database) {
  return app.post(
    '/api/databases/:currentDbId/tables/:currentTableId/merge/:selectedDbId/:selectedTableId',
    (
      req: Request<{
        currentDbId: string
        currentTableId: string
        selectedDbId: string
        selectedTableId: string
      }>,
      res: Response
    ) => {
      const { currentDbId, currentTableId, selectedDbId, selectedTableId } = req.params

      // Step 1: Get current table name and columns
      const getCurrentTableQuery = `SELECT name FROM tables WHERE dbId = ? AND id = ?`
      db.get(
        getCurrentTableQuery,
        [currentDbId, currentTableId],
        (err, currentTableData: { name: string }) => {
          if (err) {
            return res
              .status(500)
              .json({ error: 'Error retrieving current table', details: err.message })
          }

          if (!currentTableData) {
            return res.status(404).json({ error: 'Current table not found' })
          }

          // Get columns of the current table
          const getCurrentColumnsQuery = `PRAGMA table_info(${currentTableData.name})`
          db.all(getCurrentColumnsQuery, [], (err, currentColumns: { name: string }[]) => {
            if (err) {
              return res
                .status(500)
                .json({ error: 'Error retrieving current table columns', details: err.message })
            }

            // Step 2: Get selected table name and columns
            const getSelectedTableQuery = `SELECT name FROM tables WHERE dbId = ? AND id = ?`
            db.get(
              getSelectedTableQuery,
              [selectedDbId, selectedTableId],
              (err, selectedTableData: { name: string }) => {
                if (err) {
                  return res
                    .status(500)
                    .json({ error: 'Error retrieving selected table', details: err.message })
                }

                if (!selectedTableData) {
                  return res.status(404).json({ error: 'Selected table not found' })
                }

                // Get columns of the selected table
                const getSelectedColumnsQuery = `PRAGMA table_info(${selectedTableData.name})`
                db.all(getSelectedColumnsQuery, [], (err, selectedColumns: { name: string }[]) => {
                  if (err) {
                    return res.status(500).json({
                      error: 'Error retrieving selected table columns',
                      details: err.message
                    })
                  }

                  // Step 3: Map current and selected columns
                  const currentColumnNames = currentColumns.map((col) => col.name)
                  const selectedColumnNames = selectedColumns.map((col) => col.name)

                  // Step 4: Check for common columns to merge
                  const commonColumns = currentColumnNames
                    .filter((col) => selectedColumnNames.includes(col))
                    .filter((data) => data != 'id')

                  // Step 5: Get all rows from the selected table
                  const getRowsQuery = `SELECT * FROM ${selectedTableData.name}`
                  db.all(getRowsQuery, [], (err, rows: { [key: string]: unknown }[]) => {
                    if (err) {
                      return res.status(500).json({
                        error: 'Error retrieving rows from selected table',
                        details: err.message
                      })
                    }

                    // Step 6: Insert rows into the current table for common columns
                    const insertPromises = rows.map((row) => {
                      // Prepare data for the insert based on common columns
                      const insertData = {}
                      commonColumns.forEach((col) => {
                        //@ts-ignore
                        insertData[col] = row[col] // Merge only common columns
                      })

                      // Create insert query for current table
                      const columns = Object.keys(insertData)
                        .map((col) => `"${col}"`)
                        .join(', ')
                      const values = Object.values(insertData)
                        .map((value) => `"${value}"`)
                        .join(', ')

                      const insertQuery = `INSERT INTO ${currentTableData.name} (${columns}) VALUES (${values})`

                      return new Promise((resolve, reject) => {
                        db.run(insertQuery, [], (err) => {
                          if (err) {
                            return reject(err)
                          }
                          resolve(true)
                        })
                      })
                    })

                    // Step 7: Wait for all inserts to finish
                    Promise.all(insertPromises)
                      .then(() => {
                        return res.status(200).json({ message: 'Tables merged successfully' })
                      })
                      .catch((error) => {
                        return res
                          .status(500)
                          .json({ error: 'Error merging tables', details: error.message })
                      })
                  })
                })
              }
            )
          })
        }
      )
    }
  )
}

export function createDatabaseEndpoint(app: Express, db: Database) {
  return app.post('/api/databases', (req: Request, res: Response) => {
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
}

export function getDatabaseEndpoint(app: Express, db: Database) {
  return app.get('/api/databases', (req: Request, res: Response) => {
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
}
