import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FichaEditor } from './ficha-editor'

interface Props {
  params: Promise<{ id: string }>
}

async function getCard(id: string) {
  const supabase = await createClient()

  const { data: card } = await (supabase
    .from('cards')
    .select('*, work:works(*), sections(*)')
    .eq('id', id)
    .single() as any)

  if (!card) return null

  const all = (card.sections ?? []) as any[]
  const roots = all
    .filter((s: any) => s.parent_id === null)
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((root: any) => ({
      ...root,
      children: all
        .filter((s: any) => s.parent_id === root.id)
        .sort((a: any, b: any) => a.order_index - b.order_index),
    }))

  return { ...card, sections: roots }
}

export default async function FichaPage({ params }: Props) {
  const { id } = await params
  const card = await getCard(id)
  if (!card) notFound()

  return <FichaEditor card={card} />
}
