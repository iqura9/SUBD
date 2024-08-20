import { Controller, Control, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'

interface ControlledInputFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  label: string
  type?: string
  control: Control<T>
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  placeholder?: string
}

function ControlledInputField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  control,
  rules,
  placeholder
}: ControlledInputFieldProps<T>) {
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
            <Input id={name} type={type} placeholder={placeholder} className="mt-1" {...field} />
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  )
}

export default ControlledInputField
