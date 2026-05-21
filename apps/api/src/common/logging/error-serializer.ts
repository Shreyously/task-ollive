export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export function serializeError(error: unknown): SerializedError | unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: 'cause' in error ? (error as { cause?: unknown }).cause : undefined,
    };
  }

  return error;
}
