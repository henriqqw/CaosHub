import { Outlet } from 'react-router-dom'
import { BubbleMenu } from './BubbleMenu'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Global grid background — fixed, covers full page */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Grid bottom fade — above grid (z-0), below content & footer (z-10) */}
      <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-[5] bg-gradient-to-b from-transparent to-bg-primary" />

      <BubbleMenu />
      <main className="relative z-10 flex-1 pt-20">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
