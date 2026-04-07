export default function InputField({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
