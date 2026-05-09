import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import RecuperarClient from './recuperar-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('recuperarTitle') }
}

export default function RecuperarPage() {
  return <RecuperarClient />
}
