import { useId, useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/** Olho aberto — senha oculta; clique para revelar */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"
      />
    </svg>
  )
}

/** Olho com risco — senha visível; clique para ocultar */
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 6c4.5 0 8.3 2.7 9.8 6-.4.9-1 1.8-1.7 2.6l1.5 1.5c1.1-1.2 1.9-2.6 2.4-4.1C22.5 8.1 17.7 4 12 4c-1.5 0-2.9.3-4.2.8l1.6 1.6c.8-.3 1.7-.4 2.6-.4zM2.1 3.5 3.5 2.1l18.4 18.4-1.4 1.4-3.1-3.1C15.8 19.5 14 20 12 20 6.3 20 1.5 15.9 0 12c.7-1.7 1.9-3.3 3.4-4.6L2.1 3.5zm5.4 5.4 1.6 1.6A3 3 0 0 0 12 15a3 3 0 0 0 2.5-1.3l1.6 1.6A5 5 0 0 1 7.5 8.9zM12 8c.4 0 .8.1 1.1.2l-3 3A2 2 0 0 1 12 8zm-6.7.9C4.2 10 3.4 11 3 12c1.4 3.1 4.7 5.5 9 5.5 1.2 0 2.3-.2 3.3-.6l-1.6-1.6A5 5 0 0 1 7 10.1L5.3 8.9z"
      />
    </svg>
  )
}

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
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
