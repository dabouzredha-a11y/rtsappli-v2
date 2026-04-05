'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadMessages(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const fetchUnread = async () => {
      // Count messages not authored by current user in the last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('messages_dossier')
        .select('id', { count: 'exact', head: true })
        .neq('auteur_id', userId)
        .gte('created_at', since)

      setUnreadCount(count ?? 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_dossier',
      }, (payload) => {
        if (payload.new.auteur_id !== userId) {
          setUnreadCount((c) => c + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return unreadCount
}
