import { Link } from 'react-router-dom'

type AuthCardHeaderProps = {
  backTo: string
  backLabel: string
}

export function AuthCardHeader({ backTo, backLabel }: AuthCardHeaderProps) {
  return (
    <div className="login-brand-block">
      <Link to={backTo} className="login-back-link">
        ← {backLabel}
      </Link>
      <span className="login-brand-sep" aria-hidden="true">
        -
      </span>
      <Link to="/" className="login-brand-name">
        Allugme
      </Link>
    </div>
  )
}
