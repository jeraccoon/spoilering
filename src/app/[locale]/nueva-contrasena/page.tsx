import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NuevaContrasenaClient from './nueva-contrasena-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('nuevaContrasenaTitle') }
}

export default function NuevaContrasenaPage() {
  return <NuevaContrasenaClient />
}
