import type {
  User,
  Stream,
  Camera,
  ModerationEvent,
  ModerationPolicy,
  Community,
  ChatMessage,
  ViewerPreferences,
  StreamAnalytics,
} from '../types'

const API_BASE = '/api/v1'

class ApiService {
  private token: string | null = localStorage.getItem('stageside_token')

  setToken(token: string | null) {
    this.token = token
    if (token) localStorage.setItem('stageside_token', token)
    else localStorage.removeItem('stageside_token')
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      console.warn(`Request to ${path} failed or mocked:`, err)
      throw err
    }
  }

  // Auth
  async getTwitchLoginUrl(): Promise<{ login_url: string }> {
    return this.request('/auth/twitch/login')
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me')
  }

  // Streams
  async getStreams(): Promise<Stream[]> {
    return this.request('/streams')
  }

  async getStream(id: string): Promise<Stream> {
    return this.request(`/streams/${id}`)
  }

  async getStreamStatus(id: string): Promise<any> {
    return this.request(`/streams/${id}/status`)
  }

  async createStream(data: { title: string; description?: string }): Promise<Stream> {
    return this.request('/streams', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async startStream(id: string): Promise<Stream> {
    return this.request(`/streams/${id}/start`, { method: 'POST' })
  }

  async endStream(id: string): Promise<Stream> {
    return this.request(`/streams/${id}/end`, { method: 'POST' })
  }

  // Cameras
  async getCameras(streamId: string): Promise<Camera[]> {
    return this.request(`/streams/${streamId}/cameras`)
  }

  async registerCamera(streamId: string, data: any): Promise<Camera> {
    return this.request(`/streams/${streamId}/cameras`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async restoreCamera(cameraId: string): Promise<Camera> {
    return this.request(`/cameras/${cameraId}/restore`, { method: 'POST' })
  }

  // AI Sentinel
  async getSentinelStatus(streamId: string): Promise<any> {
    return this.request(`/streams/${streamId}/sentinel/status`)
  }

  async getIncidents(streamId: string): Promise<ModerationEvent[]> {
    return this.request(`/streams/${streamId}/incidents`)
  }

  async resolveIncident(incidentId: string): Promise<any> {
    return this.request(`/incidents/${incidentId}/resolve`, { method: 'POST' })
  }

  async getPolicies(streamId: string): Promise<ModerationPolicy[]> {
    return this.request(`/streams/${streamId}/policies`)
  }

  async updatePolicies(streamId: string, policies: ModerationPolicy[]): Promise<any> {
    return this.request(`/streams/${streamId}/policies`, {
      method: 'PUT',
      body: JSON.stringify({ policies }),
    })
  }

  async emergencyLock(streamId: string, reason?: string): Promise<any> {
    return this.request(`/streams/${streamId}/emergency-lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Communities
  async joinCommunity(streamId: string, interests: string[], preferred_size = 4): Promise<Community> {
    return this.request('/communities/join', {
      method: 'POST',
      body: JSON.stringify({ stream_id: streamId, interests, preferred_size }),
    })
  }

  async getStreamCommunities(streamId: string): Promise<Community[]> {
    return this.request(`/communities/streams/${streamId}`)
  }

  // Chat
  async sendMessage(communityId: string, message: string): Promise<ChatMessage> {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ community_id: communityId, message }),
    })
  }

  async getMessages(communityId: string): Promise<ChatMessage[]> {
    return this.request(`/chat/communities/${communityId}/messages`)
  }

  // Viewer POV
  async selectCamera(streamId: string, cameraId: string): Promise<any> {
    return this.request('/viewers/select-camera', {
      method: 'POST',
      body: JSON.stringify({ stream_id: streamId, camera_id: cameraId }),
    })
  }

  async getPreferences(): Promise<ViewerPreferences> {
    return this.request('/viewers/preferences')
  }

  async updatePreferences(prefs: ViewerPreferences): Promise<ViewerPreferences> {
    return this.request('/viewers/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    })
  }

  // Analytics
  async getAnalytics(streamId: string): Promise<StreamAnalytics> {
    return this.request(`/analytics/streams/${streamId}`)
  }

  // LiveKit WebRTC Token
  async getLiveKitToken(streamId: string, roomName: string): Promise<{ token: string; ws_url: string }> {
    return this.request('/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ stream_id: streamId, room_name: roomName }),
    })
  }
}

export const api = new ApiService()
