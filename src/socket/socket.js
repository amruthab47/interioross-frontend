import { io } from 'socket.io-client'
import { getAccessToken } from '../api/client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let _socket = null

export function getSocket() {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    })
  }
  return _socket
}

export function connectSocket() {
  const s = getSocket()
  // Attach latest access token before each connect so auth is fresh
  s.auth = { token: getAccessToken() }
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  _socket?.disconnect()
}
