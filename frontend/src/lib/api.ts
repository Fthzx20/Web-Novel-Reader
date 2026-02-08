import { loadSession } from "@/lib/auth";

export type Novel = {
  id: number;
  slug: string;
  title: string;
  altTitle: string;
  origin: string;
  author: string;
  team: string;
  language: string;
  status: string;
  rating: number;
  follows: string;
  chapters: number;
  latestChapter: number;
  updatedAt: string;
  tags: string[];
  synopsis: string;
  age: string;
};

export type AdminNovel = {
  id: number;
  slug: string;
  title: string;
  author: string;
  summary: string;
  tags: string[];
  coverUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: number;
  novelId: number;
  number: number;
  volume: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ReadingHistoryEntry = {
  id: number;
  userId: number;
  novelSlug: string;
  novelTitle: string;
  chapterId: number;
  chapterTitle: string;
  readAt: string;
};

export type BookmarkEntry = {
  id: number;
  userId: number;
  novelId: number;
  createdAt: string;
};

export type ReleaseQueueItem = {
  id: number;
  novelId: number;
  novelTitle: string;
  chapterNumber: number;
  title: string;
  status: string;
  eta: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ModerationReport = {
  id: number;
  novelId: number;
  novelTitle: string;
  note: string;
  createdAt: string;
};

export type UserSummary = {
  id: number;
  name: string;
  role: string;
  createdAt: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type NovelChapterStat = {
  novelId: number;
  chapterCount: number;
  latestChapterId: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "";

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function adminHeaders() {
  const session = typeof window !== "undefined" ? loadSession() : null;
  const headers: Record<string, string> = {};
  if (session?.user.role === "admin") {
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (ADMIN_API_KEY) {
    headers["X-API-Key"] = ADMIN_API_KEY;
  }
  return headers;
}

function moderationHeaders() {
  if (typeof window === "undefined") {
    return adminHeaders();
  }
  const password = window.sessionStorage.getItem("moderationPassword") ?? "";
  const headers = adminHeaders();
  if (password) {
    headers["X-Moderation-Password"] = password;
  }
  return headers;
}

export async function fetchNovels(): Promise<AdminNovel[]> {
  const response = await fetch(`${API_BASE}/novels`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load novels"));
  }
  return (await response.json()) as AdminNovel[];
}

export async function fetchNovelsAdmin(): Promise<AdminNovel[]> {
  const response = await fetch(`${API_BASE}/novels`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load novels"));
  }
  return (await response.json()) as AdminNovel[];
}

export async function fetchNovelStats(): Promise<NovelChapterStat[]> {
  const response = await fetch(`${API_BASE}/novels/stats`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load novel stats"));
  }
  return (await response.json()) as NovelChapterStat[];
}

export async function fetchNovel(id: number): Promise<AdminNovel> {
  const response = await fetch(`${API_BASE}/novels/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load novel"));
  }
  return (await response.json()) as AdminNovel;
}

export async function fetchChaptersByNovel(novelId: number): Promise<Chapter[]> {
  const response = await fetch(`${API_BASE}/novels/${novelId}/chapters`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load chapters"));
  }
  return (await response.json()) as Chapter[];
}

export async function fetchReleaseQueue(): Promise<ReleaseQueueItem[]> {
  const response = await fetch(`${API_BASE}/release-queue`, {
    headers: {
      ...adminHeaders(),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load release queue"));
  }
  return (await response.json()) as ReleaseQueueItem[];
}

export async function createReleaseQueue(input: {
  novelId: number;
  chapterNumber: number;
  title: string;
  status?: string;
  eta?: string;
  notes?: string;
}): Promise<ReleaseQueueItem> {
  const response = await fetch(`${API_BASE}/release-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create release queue item"));
  }
  return (await response.json()) as ReleaseQueueItem;
}

export async function updateReleaseQueueStatus(id: number, status: string): Promise<ReleaseQueueItem> {
  const response = await fetch(`${API_BASE}/release-queue/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update release queue"));
  }
  return (await response.json()) as ReleaseQueueItem;
}

export async function deleteReleaseQueue(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/release-queue/${id}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete release queue item"));
  }
}

export async function fetchModerationReports(): Promise<ModerationReport[]> {
  const response = await fetch(`${API_BASE}/reports`, {
    headers: {
      ...adminHeaders(),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load reports"));
  }
  return (await response.json()) as ModerationReport[];
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: {
      ...moderationHeaders(),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load users"));
  }
  return (await response.json()) as AdminUser[];
}

export async function updateUserRole(id: number, role: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE}/admin/users/${id}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...moderationHeaders(),
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update role"));
  }
  return (await response.json()) as AdminUser;
}

export async function updateUserStatus(id: number, status: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE}/admin/users/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...moderationHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update status"));
  }
  return (await response.json()) as AdminUser;
}

export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      ...moderationHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete user"));
  }
}

export async function clearUserHistory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${id}/history`, {
    method: "DELETE",
    headers: {
      ...moderationHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to clear history"));
  }
}

export async function fetchUsers(): Promise<UserSummary[]> {
  const response = await fetch(`${API_BASE}/users`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load users"));
  }
  return (await response.json()) as UserSummary[];
}

export async function deleteModerationReport(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/reports/${id}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete report"));
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Registration failed"));
  }
  return (await response.json()) as AuthResponse;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Login failed"));
  }
  return (await response.json()) as AuthResponse;
}

export async function fetchReadingHistory(token: string): Promise<ReadingHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/me/history`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load history");
  }
  return (await response.json()) as ReadingHistoryEntry[];
}

export async function fetchBookmarks(token: string): Promise<BookmarkEntry[]> {
  const response = await fetch(`${API_BASE}/me/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load bookmarks");
  }
  return (await response.json()) as BookmarkEntry[];
}

export async function recordReadingHistory(
  token: string,
  input: {
    novelSlug: string;
    novelTitle: string;
    chapterId: number;
    chapterTitle: string;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE}/me/history`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to record history");
  }
}

export async function clearReadingHistory(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/me/history`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to clear history");
  }
}

export async function followNovel(token: string, novelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/me/follows`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ novelId }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to follow"));
  }
}

export async function unfollowNovel(token: string, novelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/me/follows/${novelId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to unfollow"));
  }
}

export async function bookmarkNovel(token: string, novelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/me/bookmarks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ novelId }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to bookmark"));
  }
}

export async function unbookmarkNovel(token: string, novelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/me/bookmarks/${novelId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to remove bookmark"));
  }
}

export async function addComment(
  token: string,
  chapterId: number,
  body: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/chapters/${chapterId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to add comment"));
  }
}

export async function fetchComments(chapterId: number) {
  const response = await fetch(`${API_BASE}/chapters/${chapterId}/comments`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load comments"));
  }
  return (await response.json()) as Array<{
    id: number;
    body: string;
    userId: number;
    createdAt: string;
  }>;
}

export async function rateNovel(
  token: string,
  novelId: number,
  score: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/novels/${novelId}/ratings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ score }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to rate"));
  }
}

export async function createNovelAdmin(input: {
  title: string;
  author: string;
  summary: string;
  tags: string[];
  status: string;
  slug?: string;
  coverUrl?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/novels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create novel"));
  }
}

export async function deleteNovelAdmin(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/novels/${id}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete novel"));
  }
}

export async function createChapterAdmin(
  novelId: number,
  input: {
    number: number;
    volume: number;
    title: string;
    content: string;
  }
): Promise<Chapter> {
  const response = await fetch(`${API_BASE}/novels/${novelId}/chapters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create chapter"));
  }
  return (await response.json()) as Chapter;
}

export async function updateNovelAdmin(id: number, input: {
  title: string;
  author: string;
  summary: string;
  tags: string[];
  status: string;
  slug?: string;
  coverUrl?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/novels/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update novel"));
  }
}

export async function updateChapterAdmin(
  chapterId: number,
  input: {
    number: number;
    volume: number;
    title: string;
    content: string;
  }
): Promise<Chapter> {
  const response = await fetch(`${API_BASE}/chapters/${chapterId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update chapter"));
  }
  return (await response.json()) as Chapter;
}

export async function deleteChapterAdmin(chapterId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/chapters/${chapterId}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete chapter"));
  }
}

export type SiteSettings = {
  id: number;
  title: string;
  tagline: string;
  logoUrl: string;
  logoAlt: string;
  headline: string;
  heroDescription: string;
  primaryButton: string;
  secondaryButton: string;
  accentColor: string;
  highlightLabel: string;
  facebookUrl: string;
  discordUrl: string;
  footerUpdatesLabel: string;
  footerUpdatesUrl: string;
  footerSeriesLabel: string;
  footerSeriesUrl: string;
  footerAdminLabel: string;
  footerAdminUrl: string;
  footerLink4Label: string;
  footerLink4Url: string;
  footerLink5Label: string;
  footerLink5Url: string;
  updatedAt: string;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load settings"));
  }
  return (await response.json()) as SiteSettings;
}

export async function updateSiteSettings(input: {
  title: string;
  tagline: string;
  logoUrl: string;
  logoAlt: string;
  headline: string;
  heroDescription: string;
  primaryButton: string;
  secondaryButton: string;
  accentColor: string;
  highlightLabel: string;
  facebookUrl: string;
  discordUrl: string;
  footerUpdatesLabel: string;
  footerUpdatesUrl: string;
  footerSeriesLabel: string;
  footerSeriesUrl: string;
  footerAdminLabel: string;
  footerAdminUrl: string;
  footerLink4Label: string;
  footerLink4Url: string;
  footerLink5Label: string;
  footerLink5Url: string;
}): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update settings"));
  }
  return (await response.json()) as SiteSettings;
}

export async function uploadLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads/logo`, {
    method: "POST",
    headers: {
      ...adminHeaders(),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to upload logo"));
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function uploadNovelCover(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads/cover`, {
    method: "POST",
    headers: {
      ...adminHeaders(),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to upload cover"));
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function uploadIllustration(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads/illustration`, {
    method: "POST",
    headers: {
      ...adminHeaders(),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to upload illustration"));
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${API_BASE}/announcements`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load announcements"));
  }
  return (await response.json()) as Announcement[];
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
}): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create announcement"));
  }
  return (await response.json()) as Announcement;
}

export async function updateAnnouncement(id: number, input: {
  title: string;
  body: string;
}): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/announcements/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update announcement"));
  }
  return (await response.json()) as Announcement;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/announcements/${id}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete announcement"));
  }
}
