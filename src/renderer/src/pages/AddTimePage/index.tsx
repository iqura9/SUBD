import { Button } from '@renderer/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { useForm, SubmitHandler } from 'react-hook-form'
import ControlledInputField from '@renderer/components/ControlledInputField'
import ControlledSelectField from '@renderer/components/ControlledSelectField'

interface FormValues {
  taskName: string
  taskType: string
  hours: string
  minutes: string
  day: string
}

const taskTypes = [
  { value: 'bugfix', label: 'Bugfix' },
  { value: 'feature', label: 'Feature' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'merge', label: 'Merge Activities' },
  { value: 'other', label: 'Other' }
]

function AddTimePage() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      taskName: '',
      taskType: '',
      hours: '',
      minutes: '',
      day: new Date().toISOString().split('T')[0]
    }
  })

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
        } else {
          console.error('Failed to save task:', result.error)
        }
      })
      .catch((err) => {
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
          <ControlledInputField
            name="taskName"
            label="Task Name"
            control={control}
            rules={{ required: 'Task name is required' }}
            placeholder="Enter task name"
          />

          <ControlledSelectField
            name="taskType"
            label="Task Type"
            control={control}
            rules={{ required: 'Task type is required' }}
            options={taskTypes}
          />

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
