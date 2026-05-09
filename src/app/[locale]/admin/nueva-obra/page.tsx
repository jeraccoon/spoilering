import { Suspense } from 'react'
import NuevaObraClient from './nueva-obra-client'

export const dynamic = 'force-dynamic'

export default function NuevaObraPage() {
  return (
    <Suspense>
      <NuevaObraClient />
    </Suspense>
  )
}
