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
}

export default function FormRow({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
}: FormRowProps) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        name={name ?? id}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
