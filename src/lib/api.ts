const TOKEN_KEY = 'ironman-rb-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running on port 8787?', 0)
  }

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    // Non-JSON response (e.g. an HTML 404 page from a misconfigured proxy).
  }

  if (!res.ok) {
    const data = body as { error?: string; code?: string } | null
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code)
  }
  return body as T
}
