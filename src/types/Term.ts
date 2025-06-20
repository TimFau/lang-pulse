export interface Term {
  id: string;
  term: string;
  definition: string;
  language: string;
  next_review_at?: string;
  interval?: number;
  ease_factor?: number;
  repetition?: number;
} 