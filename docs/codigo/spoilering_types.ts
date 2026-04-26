// ============================================================
// types/database.ts
// Tipos TypeScript que reflejan el esquema de Supabase
// ============================================================

export type UserRole = 'user' | 'editor' | 'admin'
export type WorkType = 'movie' | 'series' | 'book'
export type CardStatus = 'draft' | 'published' | 'locked'
export type RevisionStatus = 'pending' | 'approved' | 'rejected' | 'superseded'

// ------------------------------------------------------------
// Tablas base (reflejan la base de datos tal cual)
// ------------------------------------------------------------

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  reputation: number
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Work {
  id: string
  type: WorkType
  title: string
  original_title: string | null
  year: number | null
  poster_url: string | null
  tmdb_id: number | null
  google_books_id: string | null
  genres: string[]
  authors: string[]
  directors: string[]
  seasons_count: number | null
  overview: string | null
  slug: string
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  work_id: string
  status: CardStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  card_id: string
  parent_id: string | null
  order_index: number
  label: string
  short_label: string | null
  content: string
  content_warning: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Revision {
  id: string
  section_id: string
  proposed_by: string
  content_before: string
  content_after: string
  summary: string | null
  status: RevisionStatus
  votes_up: number
  votes_down: number
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface RevisionVote {
  id: string
  revision_id: string
  user_id: string
  vote: boolean
  created_at: string
}

export interface AiGeneration {
  id: string
  work_id: string | null
  section_id: string | null
  generated_by: string | null
  prompt_used: string
  content_out: string
  model: string
  accepted: boolean | null
  created_at: string
}

// ------------------------------------------------------------
// Tipos enriquecidos (con joins, para uso en la UI)
// ------------------------------------------------------------

// Ficha completa con obra y secciones anidadas
export interface CardWithWork extends Card {
  work: Work
}

// Sección raíz con sus subsecciones
export interface SectionWithChildren extends Section {
  children: Section[]
}

// Ficha completa para la página de detalle
export interface CardFull extends Card {
  work: Work
  sections: SectionWithChildren[]
}

// Revisión con datos del autor
export interface RevisionWithAuthor extends Revision {
  author: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'reputation'>
  user_vote: boolean | null  // El voto del usuario actual, null si no ha votado
}

// Obra con estado de su ficha
export interface WorkWithCard extends Work {
  card: Pick<Card, 'id' | 'status'> | null
}

// ------------------------------------------------------------
// Tipos para formularios y acciones
// ------------------------------------------------------------

export interface CreateWorkInput {
  type: WorkType
  title: string
  original_title?: string
  year?: number
  poster_url?: string
  tmdb_id?: number
  google_books_id?: string
  genres?: string[]
  authors?: string[]
  directors?: string[]
  seasons_count?: number
  overview?: string
  slug: string
}

export interface CreateSectionInput {
  card_id: string
  parent_id?: string
  order_index: number
  label: string
  short_label?: string
  content: string
  content_warning?: string
}

export interface ProposeRevisionInput {
  section_id: string
  content_after: string
  summary?: string
}

// ------------------------------------------------------------
// Tipo de base de datos para el cliente de Supabase (generado)
// Este es el formato que espera createClient<Database>()
// ------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'reputation'> & {
          reputation?: number
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      works: {
        Row: Work
        Insert: Omit<Work, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Work, 'id' | 'created_at'>>
      }
      cards: {
        Row: Card
        Insert: Omit<Card, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Card, 'id' | 'created_at'>>
      }
      sections: {
        Row: Section
        Insert: Omit<Section, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Section, 'id' | 'created_at'>>
      }
      revisions: {
        Row: Revision
        Insert: Omit<Revision, 'id' | 'created_at' | 'votes_up' | 'votes_down' | 'resolved_at'> & {
          id?: string
        }
        Update: Partial<Omit<Revision, 'id' | 'created_at'>>
      }
      revision_votes: {
        Row: RevisionVote
        Insert: Omit<RevisionVote, 'id' | 'created_at'> & { id?: string }
        Update: never
      }
      ai_generations: {
        Row: AiGeneration
        Insert: Omit<AiGeneration, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<AiGeneration, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      work_type: WorkType
      card_status: CardStatus
      revision_status: RevisionStatus
    }
  }
}
