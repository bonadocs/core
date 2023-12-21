import { id } from 'ethers'

/**
 * Generates a unique contract id based on the collection ID and ABI
 * @returns
 */
export function generateContractId(
  collectionId: string,
  interfaceHash: string,
): string {
  return generateId([collectionId, interfaceHash])
}

export function generateCollectionId(): string {
  return generateId([Math.random().toString()])
}

function generateId(props: string[]): string {
  return id(props.join('\n')).slice(0, 10)
}
