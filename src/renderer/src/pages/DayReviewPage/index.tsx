import { useEffect, useState, Fragment } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'

interface Task {
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
}

function TaskReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  console.log(tasks)
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
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0])

  const filteredTasks = tasks.filter((task) => task.day === selectedDay)

  return (
    <Card className="p-6 max-w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4">Day Review</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <label htmlFor="day" className="font-semibold">
            Filter by Day:
          </label>
          <input
            type="date"
            id="day"
            className="border p-2 rounded-md"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          />
        </div>

        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead>
            <tr>
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Tracked Time</th>
              <th className="p-4 border-b">Task Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <Fragment key={index}>
                <tr>
                  <td className="p-4 border-b">
                    {task.taskType === 'feature' ? (
                      <div className="font-semibold">{task.taskName}</div>
                    ) : (
                      task.taskName
                    )}
                  </td>
                  <td className="p-4 border-b">{`${task.hours}h ${task.minutes}m`}</td>
                  <td className="p-4 border-b">{task.taskTime}</td>
                </tr>
                {task.taskType === 'feature' && task.subtask && (
                  <tr>
                    <td className="p-4 border-b pl-8 text-gray-600">{task.subtask}</td>
                    <td className="p-4 border-b text-gray-600">{task.subtaskTime}</td>
                    <td className="p-4 border-b"></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export default TaskReviewPage
