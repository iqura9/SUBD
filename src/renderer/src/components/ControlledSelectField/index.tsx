import { Controller, Control, RegisterOptions, FieldValues, Path } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Label } from '@radix-ui/react-label'

interface SelectOption {
  value: string
  label: string
}

interface ControlledSelectFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  label: string
  control: Control<T>
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  options: SelectOption[]
}

function ControlledSelectField<T extends FieldValues = FieldValues>({
  name,
  label,
  control,
  rules,
  options
}: ControlledSelectFieldProps<T>) {
  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700" htmlFor={name}>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  )
}

export default ControlledSelectField
