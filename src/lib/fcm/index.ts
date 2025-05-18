import { getApi } from '../api'
import { BonadocsClientNetworkAdapter } from '../automerge/network-adapter'

type MessagePart = {
  bonadocs: '1'
  c: string
  id: string
  i: string
  n: string
}

type BufferEntry = {
  foundIndexes: Set<number>
  parts: MessagePart[]
}

const messagesBuffer: Record<string, BufferEntry> = {}

/**
 * Call this function to handle incoming automerge messages from FCM
 * @param part
 */
export function handleFcmAutomergeData(part: Record<string, string>) {
  const castedPart = part as MessagePart
  const data = getMessage(castedPart)
  if (!data) {
    const index = parseInt(castedPart.i, 36)
    const totalParts = parseInt(castedPart.n, 36)
    console.log(
      `received part ${index + 1} of ${totalParts} of message ${castedPart.id}`,
    )
    return
  }

  if (data.source !== 'automerge') {
    return
  }

  console.log('received automerge message')
  const { projectId, collectionId, message } = data
  const networkAdapter = BonadocsClientNetworkAdapter.getNetworkAdapter(
    parseInt(projectId),
    parseInt(collectionId),
  )

  networkAdapter.receive!(message)
}

export async function registerCurrentDeviceForAutomerge(
  firebaseDeviceToken: string,
  projectId: number,
  collectionId: number,
) {
  await getApi().registerDevice(
    projectId,
    collectionId,
    firebaseDeviceToken,
    Date.now(),
  )
}

/**
 * Gets the message from the buffer if the available part
 * makes up the whole message. It deletes the message from
 * the buffer if it is complete.
 *
 * If the available part is not sufficient to make up the whole,
 * it returns null and adds the part to the buffer.
 *
 * @param part
 */
function getMessage(part: MessagePart): Record<string, string> | null {
  const { id: messageId } = part
  messagesBuffer[messageId] ??= {
    foundIndexes: new Set<number>(),
    parts: [],
  }

  const index = parseInt(part.i, 36)
  const totalParts = parseInt(part.n, 36)
  const bufferEntry = messagesBuffer[messageId]

  bufferEntry.parts[index] = part
  bufferEntry.foundIndexes.add(index)

  if (bufferEntry.foundIndexes.size !== totalParts) {
    return null
  }

  delete messagesBuffer[messageId]
  return JSON.parse(bufferEntry.parts.map((p) => p.c).join(''))
}
