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
  taskTime?: string
  subtaskTime?: string
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

const meetingTypes = [
  { value: 'planning', label: 'Planning' },
  { value: 'retrospective', label: 'Retrospective' },
  { value: 'standup', label: 'Standup' }
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
      taskTime: '',
      subtaskTime: ''
    }
  })

  const taskType = watch('taskType')

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const hours = parseInt(data.hours || '0', 10)
    const minutes = parseInt(data.minutes || '0', 10)

    const formattedData = {
      ...data,
      hours,
      minutes
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
            <ControlledInputField
              name="taskName"
              label="Task Name"
              control={control}
              rules={{ required: 'Task name is required' }}
              placeholder="Enter task name"
            />
          ) : null}

          {taskType === 'feature' && (
            <>
              <ControlledInputField
                name="subtask"
                label="Subtask"
                control={control}
                placeholder="Enter subtask"
              />
              <ControlledInputField
                name="subtaskTime"
                label="Subtask Time"
                control={control}
                placeholder="Enter subtask time"
              />
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

          {taskType === 'feature' || taskType === 'bugfix' ? (
            <ControlledInputField
              name="taskTime"
              label="Task Time"
              control={control}
              placeholder="Enter task time"
            />
          ) : null}

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
