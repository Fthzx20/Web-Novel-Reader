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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
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
  const bearer = session?.user.role === "admin" ? { Authorization: `Bearer ${session.token}` } : {};
  const key = ADMIN_API_KEY ? { "X-API-Key": ADMIN_API_KEY } : {};
  return { ...key, ...bearer };
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

export async function createChapterAdmin(
  novelId: number,
  input: {
    number: number;
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

export type SiteSettings = {
  id: number;
  title: string;
  tagline: string;
  logoUrl: string;
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
