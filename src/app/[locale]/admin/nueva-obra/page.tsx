import { Suspense } from 'react'
import NuevaObraClient from './nueva-obra-client'

export default function NuevaObraPage() {
  return (
    <Suspense>
      <NuevaObraClient />
    </Suspense>
  )
}
