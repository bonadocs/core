import { getSearchDBStore } from '../../storage'

const searchDBRoot =
  'https://raw.githubusercontent.com/bonadocs/protocol-registry/main'

interface SearchDBFile {
  path: string
  content: string
  expiry: number
}

/**
 * Downloads a file from the search database.
 * If the file is already stored in the storage and has not expired, it returns the content from the storage.
 * Otherwise, it fetches the file from the search database and stores it in the storage before returning the content.
 * @param pathInRepo - The path of the file in the search database.
 * @returns The content of the file.
 */
export async function downloadFileFromSearchDB(
  pathInRepo: string,
): Promise<string | null> {
  try {
    const fetchPromise = fetch(searchDBRoot + pathInRepo).then((response) => {
      if (response.status !== 200) {
        return null
      }
      return response.text()
    })

    const storage = await getSearchDBStore()
    let fileContent: string | null = null
    await storage.transaction(async (storage) => {
      const storedDbFile = await storage.get(pathInRepo)
      if (storedDbFile) {
        const dbFile: SearchDBFile = JSON.parse(storedDbFile)
        if (dbFile.expiry > Date.now()) {
          fileContent = dbFile.content
          return
        }
      }

      const content = await fetchPromise
      if (!content) {
        fileContent = null
        return
      }
      const expiry = Date.now() + 1000 * 60 * 60 * 24 // 24 hours
      const dbFile: SearchDBFile = { path: pathInRepo, content, expiry }
      await storage.set(pathInRepo, JSON.stringify(dbFile))
      fileContent = content
    })
    return fileContent
  } catch (e) {
    console.error(e)
    return null
  }
}
