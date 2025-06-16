import { id } from 'ethers'

/**
 * Generates a unique contract id based on the collection ID and ABI
 * @returns
 */
export function generateContractId(
  collectionId: string,
  name: string,
  interfaceHash: string,
): string {
  return generateId([collectionId, name, interfaceHash])
}

export function generateRandomId(): string {
  return generateId([Math.random().toString()])
}

function generateId(props: string[]): string {
  return id(props.join('\n')).slice(0, 10)
}

export function intersect(a: Set<number>, b: number[]): Set<number> {
  const intersection = new Set<number>()

  for (const value of b) {
    if (a.has(value)) {
      intersection.add(value)
    }
  }

  return intersection
}

export function fromHexString(hexString: string): Uint8Array {
  return Uint8Array.from(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  )
}

export function toHexString(bytes: Uint8Array): string {
  return bytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    '',
  )
}
