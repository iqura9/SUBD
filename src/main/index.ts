import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Database from 'better-sqlite3'

const dbPath = join(app.getPath('userData'), 'data.db')
console.log(dbPath)
const db = new Database(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskName TEXT NOT NULL,
    taskType TEXT NOT NULL,
    subtask TEXT,
    meetingType TEXT,
    taskHours INTEGER,
    taskMinutes INTEGER,
    subtaskHours INTEGER,
    subtaskMinutes INTEGER,
    hours INTEGER NOT NULL,
    minutes INTEGER NOT NULL,
    day TEXT NOT NULL
  )
`)

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('save-task', (_, task) => {
    try {
      const {
        taskName,
        taskType,
        subtask,
        meetingType,
        taskHours,
        taskMinutes,
        subtaskHours,
        subtaskMinutes,
        hours,
        minutes,
        day
      } = task

      // Prepare the INSERT statement
      const stmt = db.prepare(`
        INSERT INTO tasks (
          taskName, taskType, subtask, meetingType, taskHours, taskMinutes, subtaskHours, subtaskMinutes, hours, minutes, day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      // Bind the parameters and execute the statement
      stmt.run(
        taskName,
        taskType,
        subtask,
        meetingType,
        taskHours,
        taskMinutes,
        subtaskHours,
        subtaskMinutes,
        hours,
        minutes,
        day
      )
      return { success: true }
    } catch (error) {
      console.error('Failed to save task:', error)
      return { success: false, error: error ?? '' }
    }
  })

  ipcMain.handle('get-tasks', () => {
    try {
      const stmt = db.prepare('SELECT * FROM tasks')
      const tasks = stmt.all()
      return tasks
    } catch (error) {
      console.error('Failed to get tasks:', error)
      return []
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
