const locks: Record<string, string> = {}

export async function lock<T>(
  key: string,
  exec: () => T | Promise<T>,
): Promise<T> {
  await acquireLock(key)
  try {
    return await exec()
  } finally {
    delete locks[key]
  }
}

async function acquireLock(key: string) {
  const value = generateRandomValue()
  locks[key] ??= value

  while (locks[key] !== value) {
    const delay = Math.random() * 50 + 50
    await new Promise((resolve) => setTimeout(resolve, delay))
    locks[key] ??= value
  }
}

function generateRandomValue(): string {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random()).toString(36)
}
