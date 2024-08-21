/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      saveTask(task: {
        hours: number
        minutes: number
        taskName: string
        taskType: string
        subtask?: string
        meetingType?: string
        taskHours?: number
        taskMinutes?: number
        subtaskHours?: number
        subtaskMinutes?: number
        day: string
      }): Promise<{ success: boolean; error?: string }>
      getTasks(): Promise<
        Array<{
          id: number
          hours: number
          minutes: number
          taskName: string
          taskType: string
          subtask?: string
          meetingType?: string
          taskHours?: number
          taskMinutes?: number
          subtaskHours?: number
          subtaskMinutes?: number
          day: string
        }>
      >
    }
  }
}

// Make sure this file is treated as a module
export {}
