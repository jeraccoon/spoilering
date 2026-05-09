import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NuevaFichaEditor } from './nueva-ficha-editor'

export default async function NuevaFichaPage({
  params,
}: {
  params: Promise<{ workId: string }>
}) {
  const { workId } = await params
  const supabase = await createClient()

  const { data: work } = await (supabase.from('works') as any)
    .select('id, title, type, year, poster_url, overview, genres')
    .eq('id', workId)
    .maybeSingle()

  if (!work) notFound()

  return <NuevaFichaEditor work={work} />
}
