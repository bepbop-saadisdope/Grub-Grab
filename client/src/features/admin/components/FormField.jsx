export default function FormField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  multiline,
  type = 'text',
  ...rest
}) {
  const baseClass =
    'w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:border-raspberry-700 focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60 disabled:cursor-not-allowed';
  const errorClass = error ? 'border-raspberry-700' : '';

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={3}
          className={`${baseClass} ${errorClass} resize-none`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${baseClass} ${errorClass}`}
          {...rest}
        />
      )}
      {error && (
        <p className="mt-1 text-sm font-bold text-raspberry-700">{error}</p>
      )}
    </div>
  );
}
