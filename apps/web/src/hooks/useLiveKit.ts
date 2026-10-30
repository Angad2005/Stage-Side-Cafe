import { useState, useEffect } from 'react'
import { api } from '../services/api'

export function useLiveKit(streamId: string, roomName: string) {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:7880')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchToken() {
      setLoading(true)
      try {
        const res = await api.getLiveKitToken(streamId, roomName)
        if (mounted) {
          setToken(res.token)
          setWsUrl(res.ws_url)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to obtain LiveKit token')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchToken()
    return () => {
      mounted = false
    }
  }, [streamId, roomName])

  return { token, wsUrl, loading, error }
}
