import { useState, useEffect, useCallback, useRef } from 'react'
import { getNotifications, markRead, markAllRead } from '../api/notifications'
import { getSocket, connectSocket } from '../socket/socket'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const fetchedRef = useRef(false)

  const fetchAll = useCallback(() => {
    if (!user) return
    getNotifications().then(ns => setNotifications(ns)).catch(console.error)
  }, [user])

  // Initial fetch
  useEffect(() => {
    if (!user || fetchedRef.current) return
    fetchedRef.current = true
    fetchAll()
  }, [user, fetchAll])

  // Socket.io real-time subscription
  useEffect(() => {
    if (!user) return
    const socket = connectSocket()

    function onNew(notif) {
      setNotifications(prev => [notif, ...prev])
    }

    socket.on('notification:new', onNew)
    return () => { socket.off('notification:new', onNew) }
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  async function dismiss(id) {
    await markRead(id).catch(console.error)
    setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n))
  }

  async function dismissAll() {
    await markAllRead().catch(console.error)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return { notifications, unreadCount, dismiss, dismissAll, refresh: fetchAll }
}
