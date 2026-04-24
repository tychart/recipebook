/**
 * Shared form row: label + input. Used by Login, Register, and other forms.
 */
interface FormRowProps {
  label: string;
  id: string;
  name?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

export default function FormRow({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  autoComplete,
}: FormRowProps) {
  return (
    <div>
      <label className="app-label" htmlFor={id}>
        {label}
      </label>
      <input
        className="app-input"
        type={type}
        id={id}
        name={name ?? id}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </div>
  );
}
