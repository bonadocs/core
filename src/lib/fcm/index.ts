import { getApi } from '../api'

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
