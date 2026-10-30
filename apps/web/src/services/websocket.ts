import type { WSEvent } from '../types'

type EventCallback = (event: WSEvent) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private streamId: string | null = null
  private reconnectTimer: any = null

  connect(streamId: string, token?: string | null) {
    if (this.ws && this.streamId === streamId) return

    this.disconnect()
    this.streamId = streamId

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''
    const url = `${protocol}//${host}/ws/streams/${streamId}${tokenParam}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log(`[StageSide WS] Connected to stream ${streamId}`)
      }

      this.ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data)
          this.dispatch(data)
        } catch (e) {
          console.error('[StageSide WS] Failed to parse message', e)
        }
      }

      this.ws.onclose = () => {
        console.log('[StageSide WS] Disconnected. Reconnecting in 3s...')
        this.reconnectTimer = setTimeout(() => this.connect(streamId, token), 3000)
      }

      this.ws.onerror = (err) => {
        console.warn('[StageSide WS] Connection notice:', err)
      }
    } catch (e) {
      console.warn('[StageSide WS] WebSocket initial setup error:', e)
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.streamId = null
  }

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  dispatch(event: WSEvent) {
    // Specific event listeners
    const specific = this.listeners.get(event.event)
    if (specific) {
      specific.forEach((cb) => cb(event))
    }
    // Global wildcard listeners
    const all = this.listeners.get('*')
    if (all) {
      all.forEach((cb) => cb(event))
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

export const wsService = new WebSocketService()
