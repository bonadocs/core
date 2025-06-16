import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import WebSocket from 'isomorphic-ws'

import { getApi } from '../api'
import { config, validateConfig } from '../config'
import { lock } from '../util/lock'

const networkAdapters = new Map<string, BonadocsClientNetworkAdapter>()

export class BonadocsClientNetworkAdapter extends BrowserWebSocketClientAdapter {
  readonly docIdPromise: Promise<string>

  private token: string | null = null
  private originalOnMessage: (event: WebSocket.MessageEvent) => void
  private docId: string | null = null
  private resolveDocId!: (docId: string) => void

  private constructor(
    private readonly projectId: number,
    private readonly collectionId: number,
  ) {
    validateConfig()
    super(config.wsApiUrl)
    this.originalOnMessage = this.onMessage
    this.onMessage = this.newOnMessage.bind(this)
    this.docIdPromise = new Promise((resolve) => {
      this.resolveDocId = resolve
    })
  }

  static async getNetworkAdapter(projectId: number, collectionId: number) {
    const key = `${projectId}:${collectionId}`
    let adapter = networkAdapters.get(key)
    if (!adapter) {
      adapter = await lock(`create-adapter-${key}`, async () => {
        if (networkAdapters.has(key)) {
          return networkAdapters.get(key)!
        }

        const newAdapter = new BonadocsClientNetworkAdapter(
          projectId,
          collectionId,
        )
        networkAdapters.set(key, newAdapter)
        return newAdapter
      })
    }
    return adapter
  }

  join() {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      // join will be called again in the onOpen handler
      // from the base BrowserWebSocketClientAdapter
      return
    }

    this.joinWithToken().catch((e) => {
      console.error('Failed to join Bonadocs WebSocket:', e)
      this.socket?.close()
    })
  }

  getDocId(): string | null {
    return this.docId
  }

  private newOnMessage(event: WebSocket.MessageEvent) {
    // Handle messages from the server
    try {
      const message = JSON.parse(event.data.toString())
      if (message.type === 'bonadocs.auth.success' && message.documentId) {
        this.docId = message.documentId
        this.resolveDocId(message.documentId)
        console.log('Found document ID for collection:', {
          projectId: this.projectId,
          collectionId: this.collectionId,
          documentId: this.docId,
        })
      } else {
        this.originalOnMessage(event)
      }
    } catch {
      this.originalOnMessage(event)
    }
  }

  private async joinWithToken() {
    const token = await this.getWsToken()
    this.socket!.send(
      JSON.stringify({
        type: 'bonadocs.auth',
        token: token,
      }),
    )
    setTimeout(() => {
      super.join()
    }, 1000) // Delay to ensure the token is sent before joining
  }

  private async getWsToken(): Promise<string> {
    if (!this.isTokenExpired()) {
      return this.token!
    }

    const api = getApi()
    const token = await api.getWsToken(this.projectId, this.collectionId)
    if (!token) {
      throw new Error('Failed to get WebSocket token')
    }
    this.token = token
    return token
  }

  private isTokenExpired(): boolean {
    if (!this.token) {
      return true
    }

    const tokenParts = this.token.split('.')
    if (tokenParts.length !== 3) {
      return false // Invalid token format - cannot determine expiration
    }

    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      const exp = payload.exp
      if (typeof exp !== 'number') {
        return false // Expiration not present or invalid in token payload
      }

      const currentTime = Math.floor(Date.now() / 1000) // Current time in seconds
      // Token is expired if exp is less than current time
      // with a 1-minute buffer
      return exp < currentTime - 60
    } catch {
      return false // Invalid JSON in token payload - cannot determine expiration
    }
  }
}
