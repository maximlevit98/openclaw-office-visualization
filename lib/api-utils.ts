/**
 * Shared API utilities for route handlers
 */

import { NextRequest, NextResponse } from "next/server";

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
