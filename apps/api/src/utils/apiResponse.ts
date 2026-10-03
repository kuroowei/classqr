import { Response } from "express";

export function successResponse<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  error?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ?? null,
  });
}