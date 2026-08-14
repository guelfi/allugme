import { Outlet } from 'react-router-dom'
import { PublicFooter } from '../PublicFooter'

export function PublicSiteLayout() {
  return (
    <div className="public-site-layout">
      <Outlet />
      <PublicFooter />
    </div>
  )
}
