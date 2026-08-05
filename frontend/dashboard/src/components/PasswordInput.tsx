import { useId, useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordInput({ className, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={`password-input${className ? ` ${className}` : ''}`}>
      <input id={inputId} type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Revelar senha'}
        aria-pressed={visible}
        tabIndex={0}
      >
        <span aria-hidden="true">{visible ? '🙈' : '👁'}</span>
      </button>
    </div>
  )
}
