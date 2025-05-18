import { Message, NetworkAdapter, PeerId } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { decodeBase64, encodeBase64, toUtf8Bytes, toUtf8String } from 'ethers'

import { getApi } from '../api'

import { ReceivingNetworkAdapter } from './types'

const networkAdapters = new Map<string, ReceivingNetworkAdapter>()

export class BonadocsClientNetworkAdapter extends NetworkAdapter {
  private constructor(
    private readonly projectId: number,
    private readonly collectionId: number,
  ) {
    super()
  }

  static getNetworkAdapter(projectId: number, collectionId: number) {
    const key = `${projectId}:${collectionId}`
    let adapter = networkAdapters.get(key)
    if (!adapter) {
      adapter = new BrowserWebSocketClientAdapter(
        'wss://sync.automerge.org',
      ) as unknown as ReceivingNetworkAdapter
      // adapter = new BonadocsClientNetworkAdapter(projectId, collectionId)
      networkAdapters.set(key, adapter)
    }
    return adapter
  }

  connect(): void {
    console.log('bonadocs client network adapter connection')
    this.emit('peer-candidate', {
      peerId: 'bonadocs-server' as PeerId,
      peerMetadata: {},
    })
    this.emit('ready', {
      network: this,
    })
  }

  send(message: Message): void {
    const encoded = this.encodeMessage(message)
    const api = getApi()
    api
      .sendAutomergeMessage(this.projectId, this.collectionId, encoded)
      .catch((e) => {
        console.error('Failed to send message', e)
      })
  }

  receive(encodedMessage: string): void {
    const message = this.decodeMessage(encodedMessage)
    this.emit('message', message)
  }

  disconnect(): void {
    console.log('bonadocs client network adapter disconnection')
  }

  isReady() {
    return true
  }

  whenReady() {
    return Promise.resolve()
  }

  /**
   * Encodes a message to be sent over the network
   * @param message
   * @private
   */
  private encodeMessage(message: Message): string {
    const data =
      message.data != null ? encodeBase64(message.data) : message.data
    return encodeBase64(
      toUtf8Bytes(
        JSON.stringify({
          ...message,
          data,
        }),
      ),
    )
  }

  private decodeMessage(encodedMessage: string): Message {
    const message = JSON.parse(toUtf8String(decodeBase64(encodedMessage)))
    if (message.data != null) {
      message.data = decodeBase64(message.data)
    }
    return message
  }
}
