import { useEffect, useState, Fragment } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { FaBug, FaCode, FaUsers, FaTasks, FaLink } from 'react-icons/fa'
import { cn } from '@renderer/lib/utils'

interface Task {
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

function TaskReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0])

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

  const filteredTasks = tasks.filter((task) => task.day === selectedDay)

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'bugfix':
        return <FaBug className="mr-2 text-red-500" />
      case 'feature':
        return <FaCode className="mr-2 text-blue-500" />
      case 'meeting':
        return <FaUsers className="mr-2 text-green-500" />
      case 'merge':
        return <FaTasks className="mr-2 text-yellow-500" />
      default:
        return <FaLink className="mr-2 text-gray-500" />
    }
  }

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'bugfix':
        return 'Bugfix'
      case 'feature':
        return 'Feature'
      case 'meeting':
        return 'Meeting'
      case 'merge':
        return 'Merge Activities'
      default:
        return 'Other'
    }
  }

  // Calculate time in minutes
  const calculateTimeInMinutes = (hours: number, minutes: number) => hours * 60 + minutes

  // Calculate the total tracked time in minutes
  const calculateTrackedTimeInMinutes = (hours: number, minutes: number) =>
    calculateTimeInMinutes(hours, minutes)

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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tracked Time</TableHead>
              <TableHead>Task Time</TableHead>
              <TableHead>Type</TableHead> {/* New column header for type */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task, index) => {
              // Convert tracked time and task time to minutes for comparison
              const trackedTimeInMinutes = calculateTrackedTimeInMinutes(task.hours, task.minutes)
              const taskTimeInMinutes = (task.taskHours || 0) * 60 + (task.taskMinutes || 0)

              const timeClass =
                trackedTimeInMinutes > taskTimeInMinutes
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-100 text-green-600'

              return (
                <Fragment key={index}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        {getTaskIcon(task.taskType)}
                        {task.taskType === 'feature' ? (
                          <span className="font-semibold">{task.taskName}</span>
                        ) : (
                          task.taskName
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn(timeClass)}>
                      {`${task.hours}h ${task.minutes}m`}
                    </TableCell>
                    <TableCell className={cn(timeClass)}>
                      {task.taskHours || task.taskMinutes
                        ? `${task.taskHours || 0}h ${task.taskMinutes || 0}m`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{getTaskTypeLabel(task.taskType)}</TableCell>
                  </TableRow>
                  {task.taskType === 'feature' && task.subtask && (
                    <TableRow>
                      <TableCell className="pl-8 text-gray-600">
                        <div className="flex items-center">
                          {getTaskIcon('feature')}
                          {task.subtask}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {task.subtaskHours || task.subtaskMinutes
                          ? `${task.subtaskHours || 0}h ${task.subtaskMinutes || 0}m`
                          : 'N/A'}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>Subtask</TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default TaskReviewPage
