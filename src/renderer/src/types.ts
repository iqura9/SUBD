export interface ITask {
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
}
