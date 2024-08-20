import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  saveTask: (task) => ipcRenderer.invoke('save-task', task),
  getTasks: () => ipcRenderer.invoke('get-tasks')
}

// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled,
// otherwise just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api) // Expose the custom API
  } catch (error) {
    console.error('Failed to expose API:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api // Expose the custom API
}
