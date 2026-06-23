export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user_id: string;
  email: string;
  name: string;
  token: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  person_name: string;
  description: string;
  cover_color: string;
  spotify_url: string | null;
  share_token: string | null;
  is_shared: number;
  entry_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BookEntry {
  id: string;
  book_id: string;
  title: string;
  content: string;
  entry_date: string | null;
  sort_order: number;
  mood: string | null;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}

export interface Photo {
  id: string;
  entry_id?: string;
  capsule_id?: string;
  file_path: string;
  caption: string;
  sort_order: number;
  created_at?: string;
}

export interface BookDetail extends Book {
  entries: BookEntry[];
}

export interface Capsule {
  id: string;
  title: string;
  unlock_date: string;
  is_locked: boolean;
  created_at: string;
  message?: string;
  photos?: Photo[];
  photo_count?: number;
}

export interface Milestone {
  id: string;
  user_id: string;
  title: string;
  description: string;
  milestone_date: string;
  category: string;
  icon: string;
  spotify_url: string | null;
  created_at: string;
  days_until: number;
}

export interface LetterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface LetterTemplateDetail extends LetterTemplate {
  fields: { key: string; label: string; placeholder: string }[];
  body: string;
}

export interface LetterDraft {
  id: string;
  user_id: string;
  template_id: string;
  filled_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface MiniSite {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  subtitle: string;
  partner_name: string;
  theme_color: string;
  accent_color: string;
  background_style: string;
  theme: string;
  book_id: string | null;
  book_ids: string[];
  entry_ids: string[];
  milestone_ids: string[];
  show_milestones: number;
  show_photos: number;
  is_published: number;
  guest_pin: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestbookEntry {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

export interface PublicSite extends MiniSite {
  book?: BookDetail;
  books: BookDetail[];
  milestones: Milestone[];
  has_guestbook: boolean;
}

export interface OnThisDayEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  book_title: string;
  person_name: string;
}

export interface DashboardData {
  stats: {
    books: number;
    capsules: number;
    milestones: number;
    letters: number;
    sites: number;
  };
  recent_books: Book[];
  upcoming_milestones: Milestone[];
  newly_unlocked_capsules: Capsule[];
  on_this_day: {
    entries: OnThisDayEntry[];
    milestones: Milestone[];
  };
  total_entries: number;
  total_photos: number;
  together_since: string | null;
}

export interface SearchResults {
  books: { id: string; title: string; person_name: string; cover_color: string }[];
  entries: { id: string; title: string; content: string; entry_date: string | null; mood: string | null; book_id: string; book_title: string }[];
  milestones: { id: string; title: string; description: string; milestone_date: string; category: string }[];
}

export interface RandomMemory {
  id: string;
  title: string;
  content: string;
  entry_date: string | null;
  mood: string | null;
  book_title: string;
  person_name: string;
  book_id: string;
}

export interface ScheduledLetter {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  scheduled_date: string;
  is_sent: number;
  sent_at: string | null;
  created_at: string;
}

export interface CoupleInvite {
  id: string;
  invite_code: string;
  invite_email: string | null;
  status: string;
  created_at: string;
}

export interface CoupleStatus {
  linked: boolean;
  partner: User | null;
  pending_invite: CoupleInvite | null;
}
