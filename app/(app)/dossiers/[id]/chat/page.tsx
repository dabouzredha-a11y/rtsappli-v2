'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { VoiceButton } from '@/components/ui/VoiceInput'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { MessageDossier, Dossier } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Send, ImageIcon, Loader2 } from 'lucide-react'

interface Props { params: { id: string } }

export default function ChatPage({ params }: Props) {
  const { id } = params
  const { profil } = useAuth()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [messages, setMessages] = useState<MessageDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      try {
        const [{ data: d }, { data: msgs }] = await Promise.all([
          supabase.from('dossiers').select('*').eq('id', id).single(),
          supabase.from('messages_dossier').select('*').eq('dossier_id', id).order('created_at', { ascending: true }),
        ])
        setDossier(d)
        setMessages(msgs ?? [])
      } catch (err) {
        console.error('[ChatPage] init error:', err)
        setError('Erreur de chargement. Vérifiez votre connexion.')
      } finally {
        setLoading(false)
      }
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_dossier',
        filter: `dossier_id=eq.${id}`,
      }, (payload) => {
        setMessages((msgs) => [...msgs, payload.new as MessageDossier])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !profil || sending) return
    setSending(true)

    const supabase = createClient()
    await supabase.from('messages_dossier').insert({
      dossier_id: id,
      auteur_id: profil.id,
      auteur_nom: `${profil.prenom} ${profil.nom}`,
      auteur_role: profil.role,
      contenu: message.trim(),
      type: 'message',
    })

    setMessage('')
    setSending(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profil) return
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `chat/${id}/${Date.now()}.${ext}`

    const { data: upload, error } = await supabase.storage
      .from('photos')
      .upload(path, file, { cacheControl: '3600' })

    if (!error && upload) {
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(upload.path)

      await supabase.from('messages_dossier').insert({
        dossier_id: id,
        auteur_id: profil.id,
        auteur_nom: `${profil.prenom} ${profil.nom}`,
        auteur_role: profil.role,
        contenu: '📎 Photo partagée',
        photo_url: publicUrl,
        type: 'photo',
      })
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-gray-700 font-medium mb-3">{error}</p>
        <Link href={`/dossiers/${id}`} className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour au dossier
        </Link>
      </div>
    )
  }

  const myId = profil?.id

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Link href={`/dossiers/${id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-mono">{dossier?.numero}</p>
          <h1 className="text-lg font-bold text-gray-900">Messages — {dossier?.client_nom}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Aucun message. Démarrez la conversation.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.auteur_id === myId
          const isSystem = msg.type === 'system'

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.contenu}</span>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs font-medium text-gray-700">{msg.auteur_nom}</span>
                  <RoleBadge role={msg.auteur_role} size="sm" />
                </div>

                {msg.photo_url && (
                  <div className="mb-1 rounded-xl overflow-hidden border border-gray-200 max-w-xs">
                    <Image
                      src={msg.photo_url}
                      alt="Photo"
                      width={280}
                      height={200}
                      className="object-cover"
                    />
                  </div>
                )}

                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-brand-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.contenu}
                </div>
                <span className="text-xs text-gray-400 mt-1">{formatDateTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-end gap-2 mt-3 shrink-0">
        <input type="file" ref={fileRef} accept="image/*" onChange={handleImageUpload} className="hidden" />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary p-2.5 shrink-0"
          title="Envoyer une photo"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez un message..."
            className="input pr-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e as unknown as React.FormEvent)
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceButton onTranscript={(t) => setMessage((m) => m ? `${m} ${t}` : t)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="btn-primary p-2.5 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
