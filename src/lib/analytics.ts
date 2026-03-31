function getId(key: string, storage: Storage): string {
  let id = storage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    storage.setItem(key, id)
  }
  return id
}

export function track(
  eventName: string,
  metadata?: Record<string, unknown>
): void {
  const visitorId = getId('_vid', localStorage)
  const sessionId = getId('_sid', sessionStorage)

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      visitorId,
      sessionId,
      path: window.location.pathname,
      referrer: document.referrer || null,
      metadata: metadata ?? {},
    }),
    keepalive: true,
  }).catch(() => {/* silently ignore */})
}
