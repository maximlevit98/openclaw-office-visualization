/**
 * Shared API utilities for route handlers
 * 
 * Features:
 * - Safe wrapper for error handling
 * - Strict parameter validation with clear error messages
 * - Consistent response formatting
 * - Type-safe utilities
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Validation constraints
 */
export const VALIDATION_LIMITS = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 10000,
  MIN_LIMIT: 1,
  MAX_LIMIT: 1000,
  SESSION_KEY_MAX_LENGTH: 256,
} as const;

/**
 * Safe wrapper for API route handlers
 * Handles common error cases and consistent response formatting
 */
export async function withErrorHandling<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): Promise<(request: NextRequest) => Promise<NextResponse<T | { error: string; details?: string }>>> {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("API error:", message, error);

      return NextResponse.json(
        {
          error: "Internal server error",
          details: message,
        },
        { status: 500 }
      ) as NextResponse<{ error: string; details?: string }>;
    }
  };
}

/**
 * Validate required query parameters
 */
export function getQueryParam(
  request: NextRequest,
  param: string,
  required = false
): string | null {
  const value = request.nextUrl.searchParams.get(param);

  if (required && !value) {
    throw new Error(`Missing required query parameter: ${param}`);
  }

  return value;
}

/**
 * Get and validate a query parameter as a positive integer
 */
export function getQueryParamAsPositiveInt(
  request: NextRequest,
  param: string,
  options: { required?: boolean; min?: number; max?: number } = {}
): number | null {
  const { required = false, min = 1, max = Number.MAX_SAFE_INTEGER } = options;
  const value = request.nextUrl.searchParams.get(param);

  if (!value) {
    if (required) {
      throw new Error(`Missing required query parameter: ${param}`);
    }
    return null;
  }

  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Query parameter '${param}' must be an integer, got '${value}'`);
  }

  if (parsed < min || parsed > max) {
    throw new Error(
      `Query parameter '${param}' must be between ${min} and ${max}, got ${parsed}`
    );
  }

  return parsed;
}

/**
 * Validate required path parameters
 */
export function getPathParam(
  params: Record<string, string>,
  param: string,
  required = true
): string | null {
  const value = params[param];

  if (required && !value) {
    throw new Error(`Missing required path parameter: ${param}`);
  }

  return value || null;
}

/**
 * Get and validate a path parameter with length check (e.g., session key)
 */
export function getPathParamValidated(
  params: Record<string, string>,
  param: string,
  options: { required?: boolean; maxLength?: number } = {}
): string {
  const { required = true, maxLength = VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH } = options;
  const value = params[param];

  if (required && !value) {
    throw new Error(`Missing required path parameter: ${param}`);
  }

  if (!value) {
    throw new Error(`Path parameter '${param}' is empty`);
  }

  if (value.length > maxLength) {
    throw new Error(
      `Path parameter '${param}' exceeds maximum length of ${maxLength} characters`
    );
  }

  return value;
}

/**
 * Parse JSON body with validation
 */
export async function parseJSONBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<T> {
  try {
    const text = await request.text();
    if (!text) {
      throw new Error("Request body is empty");
    }
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate a message string (non-empty, reasonable length)
 */
export function validateMessage(message: unknown): string {
  if (typeof message !== "string") {
    throw new Error("Message must be a string");
  }

  const trimmed = message.trim();

  if (trimmed.length < VALIDATION_LIMITS.MIN_MESSAGE_LENGTH) {
    throw new Error("Message cannot be empty");
  }

  if (trimmed.length > VALIDATION_LIMITS.MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Message exceeds maximum length of ${VALIDATION_LIMITS.MAX_MESSAGE_LENGTH} characters`
    );
  }

  return trimmed;
}

/**
 * Build a success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Build an error response
 */
export function errorResponse(
  message: string,
  details?: string,
  status = 400
): NextResponse<{ error: string; details?: string }> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Safe response handler that ensures data is not null/undefined
 */
export function ensureResponse<T>(
  data: T | null | undefined,
  fallback: T,
  message = "Data is null or undefined"
): T {
  if (data === null || data === undefined) {
    console.warn(message);
    return fallback;
  }
  return data;
}
