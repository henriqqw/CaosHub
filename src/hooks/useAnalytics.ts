import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'

const ORIGIN = window.location.origin

const DOWNLOAD_KEYWORDS = ['download', 'baixar', 'exportar', 'salvar', 'zip', 'export']

function getLabel(el: Element): string {
  return (
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.textContent?.trim().slice(0, 80) ||
    ''
  )
}

function isExternal(href: string): boolean {
  try {
    return new URL(href).origin !== ORIGIN
  } catch {
    return false
  }
}

function isDownloadTrigger(el: Element): boolean {
  if (el.hasAttribute('download')) return true
  const text = el.textContent?.toLowerCase() ?? ''
  return DOWNLOAD_KEYWORDS.some(kw => text.includes(kw))
}

export function useAnalytics(): void {
  const location = useLocation()
  const prevPath = useRef<string | null>(null)

  // ── page_view ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname

    track('page_view', {
      title: document.title,
    })
  }, [location.pathname])

  // ── click delegation ─────────────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Element

      // External link click
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (anchor && isExternal(anchor.href)) {
        track('external_link', {
          href: anchor.href,
          label: getLabel(anchor),
        })
        return
      }

      // Download button / link
      const clickable = target.closest('a, button') as Element | null
      if (clickable && isDownloadTrigger(clickable)) {
        track('download_click', {
          label: getLabel(clickable),
          tool: location.pathname,
        })
      }
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [location.pathname])
}
