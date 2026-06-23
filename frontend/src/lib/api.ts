import {
  AuthResponse, Book, BookDetail, Capsule, Milestone,
  LetterTemplate, LetterTemplateDetail, LetterDraft,
  MiniSite, PublicSite, DashboardData, Photo,
  ScheduledLetter, GuestbookEntry, CoupleInvite, CoupleStatus,
  SearchResults, RandomMemory,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eternova_token");
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const opts: RequestInit = { method, headers };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const apiRegister = (email: string, name: string, password: string) =>
  request<AuthResponse>("POST", "/api/auth/register", { email, name, password }, false);

export const apiLogin = (email: string, password: string) =>
  request<AuthResponse>("POST", "/api/auth/login", { email, password }, false);

export const apiGoogleAuth = (credential: string) =>
  request<AuthResponse>("POST", "/api/auth/google", { credential }, false);

export const apiMe = () =>
  request<{ id: string; email: string; name: string }>("GET", "/api/auth/me");

export const apiForgotPassword = (email: string) =>
  request<{ ok: boolean; message: string }>("POST", "/api/auth/forgot-password", { email }, false);

export const apiResetPassword = (email: string, code: string, new_password: string) =>
  request<{ ok: boolean; message: string }>("POST", "/api/auth/reset-password", { email, code, new_password }, false);

// ── Dashboard ────────────────────────────────────────────────────────────────

export const apiDashboard = () =>
  request<DashboardData>("GET", "/api/dashboard");

export const apiSearch = (q: string) =>
  request<SearchResults>("GET", `/api/dashboard/search?q=${encodeURIComponent(q)}`);

export const apiRandomMemory = () =>
  request<RandomMemory | null>("GET", "/api/dashboard/random-memory");

export const apiSetTogetherSince = (date: string) =>
  request<{ ok: boolean }>("POST", "/api/dashboard/together-since", { date });

// ── Books ────────────────────────────────────────────────────────────────────

export const apiListBooks = () =>
  request<Book[]>("GET", "/api/books");

export const apiCreateBook = (data: { title: string; person_name: string; description?: string; cover_color?: string; spotify_url?: string }) =>
  request<Book>("POST", "/api/books", data);

export const apiGetBook = (id: string) =>
  request<BookDetail>("GET", `/api/books/${id}`);

export const apiUpdateBook = (id: string, data: Partial<Book>) =>
  request<Book>("PUT", `/api/books/${id}`, data);

export const apiDeleteBook = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/books/${id}`);

export const apiToggleShare = (id: string) =>
  request<Book>("POST", `/api/books/${id}/share`);

export const apiCreateEntry = (bookId: string, data: { title: string; content: string; entry_date?: string; sort_order?: number; mood?: string }) =>
  request<unknown>("POST", `/api/books/${bookId}/entries`, data);

export const apiUpdateEntry = (bookId: string, entryId: string, data: Record<string, unknown>) =>
  request<unknown>("PUT", `/api/books/${bookId}/entries/${entryId}`, data);

export const apiDeleteEntry = (bookId: string, entryId: string) =>
  request<{ ok: boolean }>("DELETE", `/api/books/${bookId}/entries/${entryId}`);

export const apiUploadPhotos = (bookId: string, entryId: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return request<Photo[]>("POST", `/api/books/${bookId}/entries/${entryId}/photos`, form);
};

export const apiDeletePhoto = (photoId: string) =>
  request<{ ok: boolean }>("DELETE", `/api/books/photos/${photoId}`);

// ── Capsules ─────────────────────────────────────────────────────────────────

export const apiListCapsules = () =>
  request<Capsule[]>("GET", "/api/capsules");

export const apiCreateCapsule = (data: { title: string; message: string; unlock_date: string }) =>
  request<Capsule>("POST", "/api/capsules", data);

export const apiGetCapsule = (id: string) =>
  request<Capsule>("GET", `/api/capsules/${id}`);

export const apiDeleteCapsule = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/capsules/${id}`);

// ── Milestones ───────────────────────────────────────────────────────────────

export const apiListMilestones = () =>
  request<Milestone[]>("GET", "/api/milestones");

export const apiCreateMilestone = (data: { title: string; description?: string; milestone_date: string; category?: string; icon?: string; spotify_url?: string }) =>
  request<Milestone>("POST", "/api/milestones", data);

export const apiUpdateMilestone = (id: string, data: Record<string, unknown>) =>
  request<Milestone>("PUT", `/api/milestones/${id}`, data);

export const apiDeleteMilestone = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/milestones/${id}`);

// ── Letters ──────────────────────────────────────────────────────────────────

export const apiListTemplates = () =>
  request<LetterTemplate[]>("GET", "/api/letters/templates");

export const apiGetTemplate = (id: string) =>
  request<LetterTemplateDetail>("GET", `/api/letters/templates/${id}`);

export const apiPreviewLetter = (template_id: string, filled_fields: Record<string, string>) =>
  request<{ rendered: string }>("POST", "/api/letters/preview", { template_id, filled_fields });

export const apiSaveDraft = (template_id: string, filled_fields: Record<string, string>) =>
  request<LetterDraft>("POST", "/api/letters/drafts", { template_id, filled_fields });

export const apiListDrafts = () =>
  request<LetterDraft[]>("GET", "/api/letters/drafts");

export const apiDeleteDraft = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/letters/drafts/${id}`);

// ── Sites ────────────────────────────────────────────────────────────────────

export const apiListSites = () =>
  request<MiniSite[]>("GET", "/api/sites");

export const apiCreateSite = (data: Record<string, unknown>) =>
  request<MiniSite>("POST", "/api/sites", data);

export const apiGetSite = (id: string) =>
  request<MiniSite>("GET", `/api/sites/${id}`);

export const apiUpdateSite = (id: string, data: Record<string, unknown>) =>
  request<MiniSite>("PUT", `/api/sites/${id}`, data);

export const apiDeleteSite = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/sites/${id}`);

export const apiTogglePublish = (id: string) =>
  request<MiniSite>("POST", `/api/sites/${id}/publish`);

// ── Public ───────────────────────────────────────────────────────────────────

export const apiGetSharedBook = (token: string) =>
  request<BookDetail>("GET", `/api/public/books/${token}`, undefined, false);

export const apiGetPublicSite = (slug: string) =>
  request<PublicSite>("GET", `/api/public/sites/${slug}`, undefined, false);

// ── Guestbook ───────────────────────────────────────────────────────────────

export const apiSubmitGuestbook = (slug: string, data: { author_name: string; message: string; pin: string }) =>
  request<GuestbookEntry>("POST", `/api/public/sites/${slug}/guestbook`, data, false);

export const apiGetGuestbook = (slug: string, pin: string) =>
  request<GuestbookEntry[]>("GET", `/api/public/sites/${slug}/guestbook?pin=${encodeURIComponent(pin)}`, undefined, false);

// ── Scheduled Letters ───────────────────────────────────────────────────────

export const apiCreateScheduledLetter = (data: { recipient_email: string; recipient_name: string; subject: string; body: string; scheduled_date: string }) =>
  request<ScheduledLetter>("POST", "/api/scheduled-letters", data);

export const apiListScheduledLetters = () =>
  request<ScheduledLetter[]>("GET", "/api/scheduled-letters");

export const apiDeleteScheduledLetter = (id: string) =>
  request<{ ok: boolean }>("DELETE", `/api/scheduled-letters/${id}`);

// ── Couple Mode ─────────────────────────────────────────────────────────────

export const apiCreateInvite = (invite_email?: string) =>
  request<CoupleInvite>("POST", "/api/couple/invite", invite_email ? { invite_email } : {});

export const apiAcceptInvite = (code: string) =>
  request<{ ok: boolean }>("POST", "/api/couple/accept", { code });

export const apiCoupleStatus = () =>
  request<CoupleStatus>("GET", "/api/couple/status");

export const apiUnlinkPartner = () =>
  request<{ ok: boolean }>("POST", "/api/couple/unlink");

// ── Helpers ──────────────────────────────────────────────────────────────────

export const photoUrl = (filename: string) => `${BASE}/uploads/${filename}`;
