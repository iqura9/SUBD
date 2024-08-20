import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'

interface Task {
  id: number
  taskName: string
  taskType: string
  hours: number
  minutes: number
  day: string
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await window.api.getTasks()
        setTasks(tasks)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      }
    }

    fetchTasks()
  }, [])

  return (
    <Card className="p-8 mx-auto w-full max-w-4xl bg-gray-50 shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-extrabold mb-6 text-blue-600">Tasks Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800">{task.taskName}</h3>
              <p className="text-gray-600">
                <strong>Task Type:</strong> {task.taskType}
              </p>
              <p className="text-gray-600">
                <strong>Hours:</strong> {task.hours}
              </p>
              <p className="text-gray-600">
                <strong>Minutes:</strong> {task.minutes}
              </p>
              <p className="text-gray-600">
                <strong>Day:</strong> {task.day}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default TasksPage
