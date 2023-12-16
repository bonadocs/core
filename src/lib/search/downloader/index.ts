const searchDBRoot =
  'https://raw.githubusercontent.com/bonadocs/protocol-search-db/main'
const localStorageRootKey = 'search-db'

const backend: Record<string, string | undefined> = {}
const localStorage = {
  getItem(key: string) {
    return backend[key]
  },
  setItem(key: string, value: string) {
    backend[key] = value
  },
}

interface SearchDBFile {
  path: string
  content: string
  expiry: number
}

/**
 * Downloads a file from the search database.
 * If the file is already stored in the local storage and has not expired, it returns the content from the local storage.
 * Otherwise, it fetches the file from the search database and stores it in the local storage before returning the content.
 * @param pathInRepo - The path of the file in the search database.
 * @returns The content of the file.
 */
export async function downloadFileFromSearchDB(
  pathInRepo: string,
): Promise<string | null> {
  const storedDbFile = localStorage.getItem(
    `${localStorageRootKey}:${pathInRepo}`,
  )
  if (storedDbFile) {
    const dbFile: SearchDBFile = JSON.parse(storedDbFile)
    if (dbFile.expiry > Date.now()) {
      return dbFile.content
    }
  }

  const url = searchDBRoot + pathInRepo
  const response = await fetch(url)
  if (response.status !== 200) {
    return null
  }
  const content = await response.text()
  const expiry = Date.now() + 1000 * 60 * 60 * 2 // 2 hours
  const dbFile: SearchDBFile = { path: pathInRepo, content, expiry }
  localStorage.setItem(
    `${localStorageRootKey}:${pathInRepo}`,
    JSON.stringify(dbFile),
  )
  return content
}
