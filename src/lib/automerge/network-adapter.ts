import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'

import { getApi } from '../api'
import { config, validateConfig } from '../config'

const networkAdapters = new Map<string, BonadocsClientNetworkAdapter>()

export class BonadocsClientNetworkAdapter extends BrowserWebSocketClientAdapter {
  private token: string | null = null

  private constructor(
    private readonly projectId: number,
    private readonly collectionId: number,
  ) {
    validateConfig()
    super(config.wsApiUrl)
  }

  static getNetworkAdapter(projectId: number, collectionId: number) {
    const key = `${projectId}:${collectionId}`
    let adapter = networkAdapters.get(key)
    if (!adapter) {
      adapter = new BonadocsClientNetworkAdapter(projectId, collectionId)
      networkAdapters.set(key, adapter)
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

  private async joinWithToken() {
    const token = await this.getWsToken()
    this.socket!.send(
      JSON.stringify({
        type: 'bonadocs.auth',
        token: token,
      }),
      () => {
        super.join()
      },
    )
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
      return exp < currentTime // Token is expired if exp is less than current time
    } catch {
      return false // Invalid JSON in token payload - cannot determine expiration
    }
  }
}
