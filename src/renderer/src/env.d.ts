/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      saveTask(task: {
        taskName: string
        taskType: string
        subtask?: string
        meetingType?: string
        taskTime?: string
        subtaskTime?: string
        hours: number
        minutes: number
        day: string
      }): Promise<{ success: boolean; error?: string }>
      getTasks(): Promise<
        Array<{
          id: number
          taskName: string
          taskType: string
          subtask?: string
          meetingType?: string
          taskTime?: string
          subtaskTime?: string
          hours: number
          minutes: number
          day: string
        }>
      >
    }
  }
}

// Make sure this file is treated as a module
export {}
