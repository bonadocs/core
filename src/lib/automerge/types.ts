import { NetworkAdapter } from '@automerge/automerge-repo'

export type ReceivingNetworkAdapter = NetworkAdapter & {
  receive?: (encodedMessage: string) => void
}
