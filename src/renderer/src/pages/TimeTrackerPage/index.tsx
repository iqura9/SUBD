import { Button } from '@renderer/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { useForm, SubmitHandler } from 'react-hook-form'
import ControlledInputField from '@renderer/components/ControlledInputField'
import ControlledSelectField from '@renderer/components/ControlledSelectField'
import { useToast } from '@renderer/components/ui/use-toast'

interface FormValues {
  taskName: string
  taskType: string
  subtask?: string
  meetingType?: string
  taskHours?: string
  taskMinutes?: string
  subtaskHours?: string
  subtaskMinutes?: string
  hours: string
  minutes: string
  day: string
}

const taskTypes = [
  { value: 'feature', label: 'Feature' },
  { value: 'bugfix', label: 'Bugfix' },
  { value: 'communication', label: 'Communication' },
  { value: 'merge', label: 'Merge Activities' },
  { value: 'codeReview', label: 'Code Review' },
  { value: 'other', label: 'Other' }
]

export const meetingTypes = [
  { value: 'daily', label: 'Daily' },
  { value: 'backlogRefinement', label: 'Backlog Refinement' },
  { value: 'planning', label: 'Planning' },
  { value: 'retrospective', label: 'Retrospective' },
  { value: 'team', label: 'Team communication' },
  { value: '1-on-1', label: '1-on-1 with PM' }
]

function AddTimePage() {
  const { toast } = useToast()

  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      taskName: '',
      taskType: '',
      hours: '',
      minutes: '',
      day: new Date().toISOString().split('T')[0],
      subtask: '',
      taskHours: '',
      taskMinutes: '',
      subtaskHours: '',
      subtaskMinutes: ''
    }
  })

  const taskType = watch('taskType')

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const hours = parseInt(data.hours || '0', 10)
    const minutes = parseInt(data.minutes || '0', 10)

    const taskHours = parseInt(data?.taskHours || '0', 10)
    const taskMinutes = parseInt(data?.taskMinutes || '0', 10)

    const subtaskHours = parseInt(data?.subtaskHours || '0', 10)
    const subtaskMinutes = parseInt(data?.subtaskMinutes || '0', 10)

    const formattedData = {
      ...data,
      hours,
      minutes,
      taskHours,
      taskMinutes,
      subtaskHours,
      subtaskMinutes
    }

    console.log(formattedData)

    window.api
      .saveTask(formattedData)
      .then((result) => {
        if (result.success) {
          console.log('Task saved successfully')
          toast({
            title: 'Task saved successfully'
          })
        } else {
          toast({
            title: 'Failed to save task',
            description: result.error,
            variant: 'destructive'
          })
          console.error('Failed to save task:', result.error)
        }
      })
      .catch((err) => {
        toast({
          title: 'Error saving task',
          description: err?.error,
          variant: 'destructive'
        })
        console.error('Error saving task:', err)
      })
  }

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4">Time Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4 min-w-96" onSubmit={handleSubmit(onSubmit)}>
          <ControlledSelectField
            name="taskType"
            label="Task Type"
            control={control}
            rules={{ required: 'Task type is required' }}
            options={taskTypes}
          />
          {taskType === 'feature' || taskType === 'bugfix' ? (
            <>
              <ControlledInputField
                name="taskName"
                label="Task Name"
                control={control}
                rules={{ required: 'Task name is required' }}
                placeholder="Enter task name"
              />
              <div className="flex space-x-4">
                <ControlledInputField
                  name="taskHours"
                  label="Task Hours"
                  type="number"
                  control={control}
                  placeholder="Hours"
                />
                <ControlledInputField
                  name="taskMinutes"
                  label="Task Minutes"
                  type="number"
                  control={control}
                  placeholder="Minutes"
                />
              </div>
            </>
          ) : null}

          {taskType === 'feature' && (
            <>
              <ControlledInputField
                name="subtask"
                label="Subtask"
                control={control}
                placeholder="Enter subtask"
              />
              <div className="flex space-x-4">
                <ControlledInputField
                  name="subtaskHours"
                  label="Subtask Hours"
                  type="number"
                  control={control}
                  placeholder="Hours"
                />
                <ControlledInputField
                  name="subtaskMinutes"
                  label="Subtask Minutes"
                  type="number"
                  control={control}
                  placeholder="Minutes"
                />
              </div>
            </>
          )}

          {taskType === 'communication' && (
            <ControlledSelectField
              name="meetingType"
              label="Meeting Type"
              control={control}
              rules={{ required: 'Meeting type is required' }}
              options={meetingTypes}
            />
          )}

          <div>
            <div className="flex space-x-4">
              <ControlledInputField
                name="hours"
                label="Hours"
                type="number"
                control={control}
                placeholder="Hours"
                rules={{ required: 'Hours are required' }}
              />
              <ControlledInputField
                name="minutes"
                label="Minutes"
                type="number"
                control={control}
                placeholder="Minutes"
                rules={{ required: 'Minutes are required' }}
              />
            </div>
          </div>

          <ControlledInputField
            name="day"
            label="Day"
            type="date"
            control={control}
            rules={{ required: 'Date is required' }}
          />

          <Button type="submit" className="w-full mt-4 bg-blue-500 text-white">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddTimePage
