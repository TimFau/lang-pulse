export type SyncPreference = 'manual' | 'auto_add' | 'auto_update' | 'auto_delete' | 'full_sync';

export interface SavedTermInput {
  term: string;
  definition: string;
  language: string;
  status?: 'published' | 'draft' | 'archived';
  source_deck?: {
    id?: string; // For linking to existing deck
    deck_name?: string;
    deck_id?: string; // This is the google sheet id
    Language1?: string;
    Language2?: string;
    status?: string;
  };
  source_term_key?: string;
  source_definition?: string;
  sync_preference?: SyncPreference;
  last_synced_at?: Date;
  next_review_at?: string;
  interval?: number;
  ease_factor?: number;
  repetition?: number;
}

export interface SavedTermMetadata {
  source_deck_id: string;
  source_term_key: string;
  source_definition: string;
  source_deck_name: string;
}

export interface SyncedDeckMetadata {
  deck_id: string;
  language: string;
  sync_preference: SyncPreference;
  term_count_at_save: number;
}

export interface SyncedDeckResponse {
  synced_decks: Array<{
    id: string;
    sync_preference: SyncPreference;
    term_count_at_save: number;
  }>;
}

export interface SavedTermResponse {
  saved_terms: Array<{
    id: string;
    term: string;
    definition: string;
    language: string;
    source_term_key?: string;
    source_definition?: string;
    sync_preference?: SyncPreference;
    date_created: string;
    source_deck?: {
      id: string;
      deck_id: string;
      deck_name: string;
      Language2: string;
      status: string;
    };
  }>;
}

export interface DeckTerm {
  Language1: string;
  Language2: string;
  [key: string]: string;
}

// Utility type for handling GraphQL errors
export interface GraphQLErrorResponse {
  graphQLErrors?: Array<{
    extensions?: {
      code: string;
    };
    message: string;
  }>;
}

export const createSavedTermInput = (
  term: string,
  definition: string,
  language: string,
  metadata?: Partial<SavedTermMetadata>,
  status: SavedTermInput['status'] = 'published'
): Omit<SavedTermInput, 'user'> => ({
  term,
  definition,
  language,
  status,
  ...(metadata?.source_deck_id && {
    source_deck: {
      deck_name: metadata.source_deck_name || metadata.source_deck_id,
      deck_id: metadata.source_deck_id, // Pass the original deckId here
      Language1: 'en', // Default source language
      Language2: language, // Target language
      status: 'published'
    }
  }),
  source_term_key: metadata?.source_term_key,
  source_definition: metadata?.source_definition
}); 