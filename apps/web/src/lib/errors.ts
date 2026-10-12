import { ApiError } from './api'

// Turns any thrown value into a message, and flags an expired/invalid session.
export function describeError(err: unknown): {
  unauthorized: boolean
  message: string
} {
  if (err instanceof ApiError) {
    return { unauthorized: err.status === 401, message: err.message }
  }
  return {
    unauthorized: false,
    message: 'Something went wrong. Please try again.',
  }
}