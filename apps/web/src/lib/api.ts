// In dev, an empty base URL means requests go to /api on the Vite dev server,
// which proxies them to the live API. For the deployed site, set VITE_API_URL.
const BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      0,
    )
  }

  let payload: Partial<ApiEnvelope<T>> | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? 'Something went wrong. Please try again.',
      response.status,
    )
  }

  return payload.data as T
}