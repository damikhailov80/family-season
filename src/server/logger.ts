type Level = 'error' | 'warn' | 'info'

interface Fields {
  err?: unknown
  [key: string]: unknown
}

function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { message: String(error) }

  const code = (error as { code?: unknown }).code
  const causes = (error as { errors?: unknown }).errors
  return {
    name: error.name,
    message: error.message,
    ...(typeof code === 'string' ? { code } : {}),
    ...(Array.isArray(causes)
      ? { causes: causes.map((item) => (item instanceof Error ? item.message : String(item))) }
      : {}),
    stack: error.stack,
  }
}

const pretty = process.env.NODE_ENV !== 'production'

function emit(level: Level, message: string, fields: Fields = {}): void {
  const { err, ...context } = fields
  const details = { ...context, ...(err === undefined ? {} : { err: serializeError(err) }) }
  const write = level === 'error' ? console.error : console.log

  if (pretty) {
    write(`${level.toUpperCase()} ${message}`, details)
    return
  }
  write(JSON.stringify({ level, time: new Date().toISOString(), message, ...details }))
}

export const logger = {
  error: (message: string, fields?: Fields) => emit('error', message, fields),
  warn: (message: string, fields?: Fields) => emit('warn', message, fields),
  info: (message: string, fields?: Fields) => emit('info', message, fields),
}
