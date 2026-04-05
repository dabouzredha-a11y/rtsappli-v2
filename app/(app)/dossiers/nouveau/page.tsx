import { DossierForm } from '@/components/dossiers/DossierForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NouveauDossierPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dossiers" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau dossier</h1>
          <p className="text-sm text-gray-500">Créer un dossier de réparation</p>
        </div>
      </div>
      <DossierForm />
    </div>
  )
}
