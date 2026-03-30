import { Outlet } from 'react-router-dom'
import { BubbleMenu } from './BubbleMenu'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <BubbleMenu />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
