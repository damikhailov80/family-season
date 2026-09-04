export function dbTarget(value) {
  try {
    const parsed = new URL(value)
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${parsed.pathname}`
  } catch {
    return 'адрес не разобрался'
  }
}
