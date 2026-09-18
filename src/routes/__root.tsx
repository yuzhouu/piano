import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import '../styles.css'
export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <main className="not-found"><h1>这首曲子还没写好。</h1><Link to="/">回到钢琴房</Link></main>,
})
