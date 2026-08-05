import type { ReactNode } from 'react'

export type IconName =
  | 'dashboard'
  | 'building'
  | 'home'
  | 'calendar'
  | 'users'
  | 'team'
  | 'settings'
  | 'palette'

const commonProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    </>
  ),
  building: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="1.2" />
      <path d="M8.5 7.5h1M14.5 7.5h1M8.5 11.5h1M14.5 11.5h1M8.5 15.5h1M14.5 15.5h1" />
      <path d="M10 21v-3.5h4V21" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4.5l8 7" />
      <path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.6" />
      <path d="M16 2.5v4M8 2.5v4M3.5 9.5h17" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.3" r="3" />
      <path d="M2.8 20c0-3.3 2.9-5.8 6.2-5.8s6.2 2.5 6.2 5.8" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.3 14.6c2.6.5 4.6 2.6 4.9 5.4" />
    </>
  ),
  team: (
    <>
      <rect x="4.5" y="4" width="15" height="16" rx="1.4" />
      <circle cx="12" cy="9.8" r="2.6" />
      <path d="M7.5 17.2c0-2.3 2-3.7 4.5-3.7s4.5 1.4 4.5 3.7" />
    </>
  ),
  settings: (
    <>
      <line x1="4" y1="6.5" x2="20" y2="6.5" />
      <circle cx="9.5" cy="6.5" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="4" y1="17.5" x2="20" y2="17.5" />
      <circle cx="9.5" cy="17.5" r="2" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.4-1.3.1-.8.8-1.4 1.7-1.4H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8z" />
      <circle cx="7.7" cy="10.5" r="1.1" />
      <circle cx="11" cy="7" r="1.1" />
      <circle cx="15" cy="8" r="1.1" />
      <circle cx="16.3" cy="12" r="1.1" />
    </>
  ),
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg {...commonProps} className={className}>
      {paths[name]}
    </svg>
  )
}
