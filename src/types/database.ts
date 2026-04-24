export type UserRole = 'user' | 'editor' | 'admin'
export type WorkType = 'movie' | 'series' | 'book'
export type CardStatus = 'draft' | 'published' | 'locked'
export type RevisionStatus = 'pending' | 'approved' | 'rejected' | 'superseded'

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
  cast: string[] | null
  seasons_count: number | null
  runtime: number | null
  overview: string | null
  publisher: string | null
  isbn: string | null
  pages: number | null
  saga: string | null
  saga_order: number | null
  slug: string
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  work_id: string
  status: CardStatus
  created_by: string | null
  is_complete: boolean
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

export interface SectionWithChildren extends Section {
  children: Section[]
}

export interface CardWithWork extends Card {
  work: Work
}

export interface CardFull extends Card {
  work: Work
  sections: SectionWithChildren[]
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      works: { Row: Work; Insert: Partial<Work>; Update: Partial<Work> }
      cards: { Row: Card; Insert: Partial<Card>; Update: Partial<Card> }
      sections: { Row: Section; Insert: Partial<Section>; Update: Partial<Section> }
      revisions: { Row: Revision; Insert: Partial<Revision>; Update: Partial<Revision> }
      revision_votes: { Row: RevisionVote; Insert: Partial<RevisionVote>; Update: never }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
