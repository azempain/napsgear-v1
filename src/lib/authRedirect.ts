const DEFAULT_AUTH_REDIRECT = '/account/'

export function safeAuthRedirect(search: string) {
  const raw = new URLSearchParams(search).get('next')
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT
  }

  try {
    const url = new URL(raw, 'https://local.invalid')
    return url.origin === 'https://local.invalid'
      ? `${url.pathname}${url.search}${url.hash}`
      : DEFAULT_AUTH_REDIRECT
  } catch {
    return DEFAULT_AUTH_REDIRECT
  }
}

export function authHref(path: '/login/' | '/signup/', next = '/checkout/') {
  return `${path}?next=${encodeURIComponent(next)}`
}
