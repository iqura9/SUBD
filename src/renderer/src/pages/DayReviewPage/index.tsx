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

import { cn } from '@renderer/lib/utils'
import { meetingTypes } from '../TimeTrackerPage'
import {
  calculateRemainingTime,
  calculateTimeInMinutes,
  getTaskIcon,
  getTaskTypeLabel
} from '@renderer/utils'
import { ITask } from '@renderer/types'

function TaskReviewPage() {
  const [tasks, setTasks] = useState<ITask[]>([])
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

  const meetingTypesMap = meetingTypes.reduce(
    (acc, { value, label }) => {
      acc[value] = label
      return acc
    },
    {} as Record<string, string>
  )

  const getMeetingType = (meetingType: string): string => {
    return meetingType in meetingTypesMap ? meetingTypesMap[meetingType] : 'Other'
  }

  // Calculate totals
  const totals = filteredTasks.reduce(
    (acc, task) => {
      const trackedTimeInMinutes = calculateTimeInMinutes(task.hours, task.minutes)
      const taskTimeInMinutes = (task.taskHours || 0) * 60 + (task.taskMinutes || 0)

      acc.totalTrackedTime += trackedTimeInMinutes
      acc.totalTaskTime += taskTimeInMinutes
      acc.totalRemainingTime += calculateRemainingTime(taskTimeInMinutes, trackedTimeInMinutes)

      if (task.taskType === 'feature' && task.subtask) {
        const subtaskTimeInMinutes = (task.subtaskHours || 0) * 60 + (task.subtaskMinutes || 0)

        acc.totalTrackedTime += subtaskTimeInMinutes
        acc.totalTaskTime += subtaskTimeInMinutes
        acc.totalRemainingTime += calculateRemainingTime(subtaskTimeInMinutes, trackedTimeInMinutes)
      }

      return acc
    },
    { totalTrackedTime: 0, totalTaskTime: 0, totalRemainingTime: 0 }
  )

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
              <TableHead>Remaining Time</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredTasks.map((task, index) => {
              const trackedTimeInMinutes = calculateTimeInMinutes(task.hours, task.minutes)
              const taskTimeInMinutes = (task.taskHours || 0) * 60 + (task.taskMinutes || 0)

              const remainingTimeInMinutes = calculateRemainingTime(
                taskTimeInMinutes,
                trackedTimeInMinutes
              )

              const subtaskTimeInMinutes =
                (task.subtaskMinutes || 0) * 60 + (task.subtaskMinutes || 0)

              const remainingSubtaskTimeInMinutes = calculateRemainingTime(
                subtaskTimeInMinutes,
                trackedTimeInMinutes
              )

              const timeClass =
                trackedTimeInMinutes > taskTimeInMinutes
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-100 text-green-600'

              return (
                <Fragment key={index}>
                  <TableRow>
                    {task.taskType === 'communication' ? (
                      <TableCell>
                        <div className="flex items-center">
                          {getTaskIcon(task.taskType)}
                          {getMeetingType(task.meetingType ?? '')}
                        </div>
                      </TableCell>
                    ) : (
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
                    )}

                    <TableCell className={cn(timeClass)}>
                      {`${task.hours}h ${task.minutes}m`}
                    </TableCell>
                    <TableCell className={cn(timeClass)}>
                      {task.taskHours || task.taskMinutes
                        ? `${task.taskHours || 0}h ${task.taskMinutes || 0}m`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className={cn(timeClass)}>
                      {remainingTimeInMinutes > 0
                        ? `${Math.floor(remainingTimeInMinutes / 60)}h ${remainingTimeInMinutes % 60}m`
                        : 'Completed'}
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
                      <TableCell className={cn(timeClass)}>
                        {`${task.subtaskHours || 0}h ${task.subtaskMinutes || 0}m`}
                      </TableCell>
                      <TableCell className={cn(timeClass)}>
                        {task.subtaskHours || task.subtaskMinutes
                          ? `${task.subtaskHours || 0}h ${task.subtaskMinutes || 0}m`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className={cn(timeClass)}>
                        {remainingSubtaskTimeInMinutes > 0
                          ? `${Math.floor(remainingSubtaskTimeInMinutes / 60)}h ${remainingSubtaskTimeInMinutes % 60}m`
                          : 'Completed'}
                      </TableCell>

                      <TableCell>Subtask</TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}

            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell>{`${Math.floor(totals.totalTrackedTime / 60)}h ${totals.totalTrackedTime % 60}m`}</TableCell>
              <TableCell>{`${Math.floor(totals.totalTaskTime / 60)}h ${totals.totalTaskTime % 60}m`}</TableCell>
              <TableCell>{`${Math.floor(totals.totalRemainingTime / 60)}h ${totals.totalRemainingTime % 60}m`}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default TaskReviewPage
