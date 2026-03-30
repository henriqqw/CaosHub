import { Outlet } from 'react-router-dom'
import { DesktopSidebar, MobileSidebar } from './Sidebar'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Global grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <DesktopSidebar />
      <MobileSidebar />

      {/* Main — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-52">
        <main className="relative z-10 flex-1 pt-14 lg:pt-0">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
