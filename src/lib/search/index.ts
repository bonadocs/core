import { downloadFileFromSearchDB } from './downloader'

/**
 * Represents a search query.
 */
export interface SearchQuery {
  q: string
  tags?: string[]
  chainIds?: number[]
  page?: number
  pageSize?: number
}

/**
 * Represents the search results.
 */
export interface SearchResults<TItem> {
  page: number
  pageSize: number
  total: number
  items: TItem[]
}

/**
 * Represents a protocol item in the quick search results.
 */
export interface QuickSearchItem {
  slug: string
  name: string
}

/**
 * Represents a link in a protocol metadata.
 */
export interface SearchItemLink {
  label: string
  imgURI: string
  url: string
}

/**
 * Represents a protocol with full metadata.
 */
export interface DeepSearchItem {
  name: string
  slug: string
  description: string
  collection: string
  website: string
  logo: string
  tags: string[]
  chainIds: number[]
  links: SearchItemLink[]
}

const namesFile = '/names.txt'
const tagsFile = '/tags.txt'

/**
 * Performs a quick search based on the given query.
 * The quick search only searches for protocol names and slugs.
 * It does not load the full protocol metadata.
 *
 * @param query The search query.
 * @returns The search results.
 */
export async function quickSearch(
  query: SearchQuery,
): Promise<SearchResults<QuickSearchItem>> {
  const { q, tags, chainIds: chains, page = 1, pageSize = 10 } = query

  // search for names that match the query
  let result = await searchNames(q)

  // filter the results by the chains queried
  if (chains) {
    result = await filterQuickSearchItemsByChainIds(result, chains)
  }

  // filter the results by the tags queried
  if (tags) {
    result = await filterQuickSearchItemsByTags(result, tags)
  }

  return {
    page,
    pageSize,
    total: result.length,
    items: result.slice((page - 1) * pageSize, page * pageSize),
  }
}

/**
 * Performs a deep search based on the given query.
 * The deep search loads the full metadata for each protocol.
 * It is slower than the quick search so pagination is recommended.
 * A quick search is performed first to filter the results.
 *
 * @param query The search query.
 * @returns The search results.
 */
export async function deepSearch(
  query: SearchQuery,
): Promise<SearchResults<DeepSearchItem>> {
  const quickSearchResults = await quickSearch(query)
  const deepSearchResults = await Promise.all(
    quickSearchResults.items.map((item) => {
      try {
        return loadProtocolMetadata(item.slug)
      } catch (e) {
        console.error(e)
        return null
      }
    }),
  )
  return {
    page: quickSearchResults.page,
    pageSize: quickSearchResults.pageSize,
    total: quickSearchResults.total,
    items: deepSearchResults.filter((item) => !!item) as DeepSearchItem[],
  }
}

/**
 * This starts a pre-indexing process for the search database.
 * This process should be run asynchronously and users can
 * still use the search feature while this process is running.
 */
export async function preIndexDataForSearchDB() {
  const promises = []

  // download the names file. It is the most important file
  // for search as it is used in every search. It must be
  // cached first to avoid any delays in the search.
  await downloadFileFromSearchDB(namesFile)

  // download the tags file. It stores the list of all tags
  // files. We need to download all of them to cache them.
  promises.push(
    downloadFileFromSearchDB(tagsFile).then((tags) => {
      if (!tags) {
        console.error('Could not find tags file')
        return
      }
      return Promise.all(
        tags
          .trim()
          .split('\n')
          .map((tag) => downloadFileFromSearchDB(`/tags/${tag}.txt`)),
      )
    }),
  )

  // download the chain files for a few popular chains
  const popularChainIds = [1, 56, 137, 42161, 10, 43114, 25, 2222, 8453, 100]
  promises.push(
    Promise.all(
      popularChainIds.map((chainId) =>
        downloadFileFromSearchDB(`/chains/evm${chainId}.txt`),
      ),
    ),
  )
  return Promise.all(promises)
}

/**
 * Loads the protocol slugs for the given chain ID.
 * @param chainId The chain ID.
 * @returns The protocol slugs.
 */
async function loadChainProtocolSlugs(chainId: number): Promise<string[]> {
  const chainFile = `/chains/evm${chainId}.txt`
  const chainFileData = await downloadFileFromSearchDB(chainFile)
  return chainFileData?.split('\n') || []
}

/**
 * Loads the protocol slugs for the given tag.
 * @param tag The tag.
 * @returns The protocol slugs.
 */
async function loadTagProtocolSlugs(tag: string): Promise<string[]> {
  const tagFile = `/tags/${tag}.txt`
  const tagFileData = await downloadFileFromSearchDB(tagFile)
  return tagFileData?.split('\n') || []
}

/**
 * Filters the quick search items by the given chain IDs.
 * @param items The quick search items.
 * @param chainIds The chain IDs.
 * @returns The filtered quick search items.
 */
async function filterQuickSearchItemsByChainIds(
  items: QuickSearchItem[],
  chainIds: number[],
): Promise<QuickSearchItem[]> {
  // load the slugs for all protocols on each chain queried
  const slugsOnChain = await Promise.all(chainIds.map(loadChainProtocolSlugs))

  // make sure that the protocol slugs are unique
  const uniqueSlugsOnChain = new Set<string>(slugsOnChain.flat())

  // filter the quick search items to only include those that are on any of the queried chains
  return items.filter((item) => uniqueSlugsOnChain.has(item.slug))
}

/**
 * Filters the quick search items by the given tags.
 * @param items The quick search items.
 * @param tags The tags.
 * @returns The filtered quick search items.
 */
async function filterQuickSearchItemsByTags(
  items: QuickSearchItem[],
  tags: string[],
): Promise<QuickSearchItem[]> {
  // load the slugs for all protocols with each tag queried
  const slugsWithTag = await Promise.all(tags.map(loadTagProtocolSlugs))

  // make sure that the protocol slugs are unique
  const uniqueSlugsWithTag = new Set<string>(slugsWithTag.flat())

  // filter the quick search items to only include those that have any of the queried tags
  return items.filter((item) => uniqueSlugsWithTag.has(item.slug))
}

/**
 * Loads the metadata for the given protocol slug.
 * @param slug The protocol slug.
 * @returns The protocol metadata.
 */
async function loadProtocolMetadata(slug: string): Promise<DeepSearchItem> {
  const metadata = await downloadFileFromSearchDB(`/data/${slug}.json`)
  if (!metadata) {
    throw new Error(`Could not find metadata for ${slug}`)
  }
  const { name, description, collection, website, logo, tags, chains, links } =
    JSON.parse(metadata)
  if (
    !name ||
    !description ||
    !collection ||
    !website ||
    !logo ||
    !tags ||
    !chains ||
    !links ||
    !Array.isArray(links)
  ) {
    throw new Error(`Invalid metadata for ${slug}`)
  }
  return {
    name,
    slug,
    description,
    collection,
    website,
    logo,
    tags: tags.split(','),
    chainIds: chains.split(',').map((chain: string) => parseInt(chain)),
    links,
  }
}

/**
 * Searches for protocol names and slugs that match the given query.
 * @param q The query.
 * @returns The protocol names and slugs that match the query.
 */
async function searchNames(q: string): Promise<QuickSearchItem[]> {
  const names = await downloadFileFromSearchDB(namesFile)
  if (!names) {
    throw new Error('FATAL: names file not found')
  }
  return names
    .split('\n')
    .filter((name) => name.includes(q))
    .map((name) => {
      const slugAndName = name.split(':')
      return {
        slug: slugAndName[0].trim(),
        name: slugAndName[1].trim(),
      }
    })
}
