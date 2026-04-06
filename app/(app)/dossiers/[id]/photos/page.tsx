'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Photo, Dossier } from '@/lib/types'
import { CATEGORIE_PHOTO } from '@/lib/constants'
import { ArrowLeft, Upload, Loader2, Trash2, ImageIcon } from 'lucide-react'

interface Props { params: { id: string } }

export default function PhotosPage({ params }: Props) {
  const { id } = params
  const { profil } = useAuth()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [categorie, setCategorie] = useState<string>('avant')
  const [commentaire, setCommentaire] = useState('')
  const [selected, setSelected] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    try {
      const supabase = createClient()
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from('dossiers').select('*').eq('id', id).single(),
        supabase.from('photos').select('*').eq('dossier_id', id).order('created_at', { ascending: false }),
      ])
      setDossier(d)
      setPhotos(p ?? [])
    } catch (err) {
      console.error('[PhotosPage] fetchPhotos error:', err)
      setError('Erreur de chargement. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPhotos() }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !profil) return
    setUploading(true)

    const supabase = createClient()
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `dossiers/${id}/${categorie}/${Date.now()}.${ext}`

      const { data: upload, error } = await supabase.storage
        .from('photos')
        .upload(path, file, { cacheControl: '3600' })

      if (!error && upload) {
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(upload.path)
        await supabase.from('photos').insert({
          dossier_id: id,
          url: publicUrl,
          categorie,
          commentaire: commentaire || null,
        })
      }
    }

    setCommentaire('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    fetchPhotos()
  }

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Supprimer cette photo ?')) return
    const supabase = createClient()
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos((p) => p.filter((ph) => ph.id !== photo.id))
    if (selected?.id === photo.id) setSelected(null)
  }

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-gray-700 font-medium mb-3">{error}</p>
        <Link href={`/dossiers/${id}`} className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour au dossier
        </Link>
      </div>
    )
  }

  const byCategorie = Object.entries(CATEGORIE_PHOTO).map(([key, label]) => ({
    key,
    label,
    photos: photos.filter((p) => p.categorie === key),
  })).filter((g) => g.photos.length > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dossiers/${id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-mono">{dossier?.numero}</p>
          <h1 className="text-xl font-bold text-gray-900">Photos — {dossier?.client_nom}</h1>
        </div>
      </div>

      {/* Upload */}
      <div className="card p-4">
        <h3 className="font-medium text-gray-900 mb-3 text-sm">Ajouter des photos</h3>
        <div className="flex flex-wrap gap-3">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="input w-auto">
            {Object.entries(CATEGORIE_PHOTO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className="input flex-1 min-w-40"
            placeholder="Commentaire (optionnel)"
          />
          <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-primary"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
              : <><Upload className="w-4 h-4" /> Téléverser</>
            }
          </button>
        </div>
      </div>

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune photo pour ce dossier</p>
        </div>
      ) : (
        byCategorie.map(({ key, label, photos: categoryPhotos }) => (
          <div key={key} className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">{label} ({categoryPhotos.length})</h3>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categoryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square cursor-pointer"
                  onClick={() => setSelected(photo)}
                >
                  <Image
                    src={photo.url}
                    alt={photo.commentaire ?? label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo) }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {photo.commentaire && (
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                      {photo.commentaire}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selected.url}
              alt="Photo"
              width={900}
              height={700}
              className="rounded-xl object-contain max-h-[80vh] w-auto"
            />
            {selected.commentaire && (
              <p className="text-white text-sm text-center mt-3">{selected.commentaire}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-800 rounded-full flex items-center justify-center text-sm font-bold hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
