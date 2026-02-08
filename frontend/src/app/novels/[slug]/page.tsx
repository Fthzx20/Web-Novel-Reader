"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Share2, Star } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  addComment,
  bookmarkNovel,
  fetchChaptersByNovel,
  fetchComments,
  fetchBookmarks,
  fetchNovels,
  fetchReadingHistory,
  followNovel,
  rateNovel,
  unbookmarkNovel,
  unfollowNovel,
  type AdminNovel,
  type Chapter,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

type StoredState = {
  follow: boolean;
  bookmark: boolean;
  rating: number | null;
  comments: { id: number; name: string; note: string; time: string }[];
  readChapters: number[];
};

export default function NovelPage() {
  const params = useParams();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const resolvedSlug = slugParam ?? "";
  const session = useAuthSession();
  const sessionToken = session?.token ?? null;
  const [novel, setNovel] = useState<AdminNovel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const coverUrl = novel?.coverUrl ? resolveAssetUrl(novel.coverUrl) : "";
  const latestChapter = chapters[chapters.length - 1];
  const storageKey = resolvedSlug ? `novel:${resolvedSlug}:state` : "";

  const storedState = useMemo(() => {
    if (typeof window === "undefined" || !storageKey) {
      return null;
    }
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as StoredState;
    } catch {
      window.localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey]);

  const [follow, setFollow] = useState(() => storedState?.follow ?? false);
  const [bookmark, setBookmark] = useState(() => storedState?.bookmark ?? false);
  const [rating, setRating] = useState<number | null>(() => storedState?.rating ?? null);
  const [comments, setComments] = useState<StoredState["comments"]>(
    () => storedState?.comments ?? []
  );
  const [commentText, setCommentText] = useState("");
  const [readChapters, setReadChapters] = useState<number[]>(
    () => storedState?.readChapters ?? []
  );
  const [shareStatus, setShareStatus] = useState("");
  const [volumeFilter, setVolumeFilter] = useState<number | "All">("All");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!resolvedSlug) {
      return;
    }
    fetchNovels()
      .then((items) => {
        const found = items.find((item) => item.slug === resolvedSlug) ?? null;
        setNovel(found);
        if (found) {
          return fetchChaptersByNovel(found.id).then((data) => setChapters(data));
        }
        setChapters([]);
        return undefined;
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Failed to load novel.");
      });
  }, [resolvedSlug]);

  useEffect(() => {
    if (!sessionToken || !novel) {
      return;
    }
    fetchBookmarks(sessionToken)
      .then((data) => {
        const isBookmarked = data.some((entry) => entry.novelId === novel.id);
        setBookmark(isBookmarked);
      })
      .catch(() => null);
  }, [sessionToken, novel]);

  useEffect(() => {
    if (!sessionToken || !novel) {
      return;
    }
    fetchReadingHistory(sessionToken)
      .then((data) => {
        const chapterIds = data
          .filter((entry) => entry.novelSlug === novel.slug)
          .map((entry) => entry.chapterId);
        setReadChapters(Array.from(new Set(chapterIds)));
      })
      .catch(() => null);
  }, [sessionToken, novel]);

  const commentsChapterId = latestChapter?.id ?? chapters[0]?.id;

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) {
      return;
    }
    const payload: StoredState = {
      follow,
      bookmark,
      rating,
      comments,
      readChapters,
    };
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [follow, bookmark, rating, comments, readChapters, storageKey]);

  useEffect(() => {
    if (!commentsChapterId) {
      return;
    }
    fetchComments(commentsChapterId)
      .then((data) => {
        setComments(
          data.map((item) => ({
            id: item.id,
            name: `Reader ${item.userId}`,
            note: item.body,
            time: new Date(item.createdAt).toLocaleString(),
          }))
        );
      })
      .catch(() => null);
  }, [commentsChapterId]);

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied!");
    } catch {
      setShareStatus("Copy failed");
    }
    window.setTimeout(() => setShareStatus(""), 2000);
  };

  const markRead = (chapterId: number) => {
    setReadChapters((current) =>
      current.includes(chapterId) ? current : [...current, chapterId]
    );
  };

  const chaptersWithVolume = useMemo(() => {
    return chapters.map((chapter) => ({
      ...chapter,
      volume:
        chapter.volume && chapter.volume > 0
          ? chapter.volume
          : Math.max(1, Math.ceil(chapter.number / 10)),
    }));
  }, [chapters]);

  const formatReadTime = (words: number) => {
    if (!words) {
      return "";
    }
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  };

  const volumes = useMemo(() => {
    const unique = Array.from(new Set(chaptersWithVolume.map((chapter) => chapter.volume)));
    return unique.sort((a, b) => a - b);
  }, [chaptersWithVolume]);

  const visibleChapters = useMemo(() => {
    if (volumeFilter === "All") {
      return chaptersWithVolume;
    }
    return chaptersWithVolume.filter((chapter) => chapter.volume === volumeFilter);
  }, [chaptersWithVolume, volumeFilter]);

  const chapterMeta = useMemo(() => {
    return visibleChapters.map((chapter) => {
      const trimmed = chapter.content.trim();
      const words = chapter.wordCount || (trimmed ? trimmed.split(/\s+/).length : 0);
      const releasedAt = chapter.createdAt
        ? new Date(chapter.createdAt).toLocaleDateString()
        : "";
      return {
        chapter,
        words,
        releasedAt,
        timeLabel: formatReadTime(words),
      };
    });
  }, [visibleChapters]);

  if (!novel) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl px-6 py-16">
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              {notice || "Loading series..."}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div
                className="flex h-80 w-56 items-center justify-center rounded-2xl border border-border/50 bg-card/60 text-3xl font-semibold sm:h-96 sm:w-64"
              >
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={novel.title}
                    width={256}
                    height={384}
                    className="h-full w-full rounded-2xl object-cover"
                    unoptimized
                  />
                ) : (
                  novel.title.charAt(0)
                )}
              </div>
              <div className="space-y-3">
                <Badge variant="outline">{novel.status}</Badge>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  {novel.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {novel.author}
                </p>
                <p className="text-sm text-muted-foreground">{novel.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((tag) => (
                    <Badge key={tag} variant="subtle">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                asChild={Boolean(latestChapter)}
                disabled={!latestChapter}
              >
                {latestChapter ? (
                  <Link href={`/read/${novel.slug}/${latestChapter.id}`}>
                    Read latest
                  </Link>
                ) : (
                  <span>Read latest</span>
                )}
              </Button>
              <Button
                variant={follow ? "secondary" : "outline"}
                onClick={async () => {
                  if (!session) {
                    setNotice("Login to follow series.");
                    return;
                  }
                  const next = !follow;
                  setFollow(next);
                  try {
                    if (next) {
                      await followNovel(session.token, novel.id);
                    } else {
                      await unfollowNovel(session.token, novel.id);
                    }
                  } catch (err) {
                    setNotice(err instanceof Error ? err.message : "Failed to update follow.");
                  }
                }}
              >
                {follow ? "Following" : "Follow"}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  if (!session) {
                    setNotice("Login to bookmark series.");
                    return;
                  }
                  const next = !bookmark;
                  setBookmark(next);
                  try {
                    if (next) {
                      await bookmarkNovel(session.token, novel.id);
                    } else {
                      await unbookmarkNovel(session.token, novel.id);
                    }
                  } catch (err) {
                    setBookmark(!next);
                    setNotice(err instanceof Error ? err.message : "Failed to update bookmark.");
                  }
                }}
              >
                {bookmark ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {bookmark ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button variant="ghost" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {shareStatus && (
                <span className="text-xs text-muted-foreground">
                  {shareStatus}
                </span>
              )}
              {notice && <span className="text-xs text-amber-200">{notice}</span>}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Chapter list</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={volumeFilter === "All" ? "secondary" : "outline"}
                    onClick={() => setVolumeFilter("All")}
                  >
                    All volumes
                  </Button>
                  {volumes.map((volume) => (
                    <Button
                      key={volume}
                      size="sm"
                      variant={volumeFilter === volume ? "secondary" : "outline"}
                      onClick={() => setVolumeFilter(volume)}
                    >
                      Vol. {volume}
                    </Button>
                  ))}
                </div>
                {chapterMeta.map(({ chapter, words, releasedAt, timeLabel }) => (
                  <Link
                    key={chapter.id}
                    href={`/read/${novel.slug}/${chapter.id}`}
                    className="flex w-full flex-col gap-2 rounded-lg border border-border/40 px-4 py-3 text-left text-sm hover:border-amber-200/50 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => markRead(chapter.id)}
                  >
                    <div>
                      <p className="font-medium">
                        Vol. {chapter.volume} · Chapter {chapter.number}: {chapter.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {words ? `${words} words` : ""}
                        {words && timeLabel ? " · " : ""}
                        {timeLabel}
                        {releasedAt ? ` · ${releasedAt}` : ""}
                      </p>
                    </div>
                    <Badge variant={readChapters.includes(chapter.id) ? "subtle" : "outline"}>
                      {readChapters.includes(chapter.id) ? "Read" : "New"}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Series info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Author</span>
                  <span className="text-foreground">{novel.author}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-foreground">{novel.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chapters</span>
                  <span className="text-foreground">{chapters.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="text-foreground">
                    {novel.createdAt ? new Date(novel.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last update</span>
                  <span className="text-foreground">
                    {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Reader rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Star className="h-4 w-4 text-amber-200" />
                  Rate this series
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Button
                      key={index}
                      variant={rating === index + 1 ? "secondary" : "outline"}
                      size="icon"
                      onClick={async () => {
                        if (!session) {
                          setNotice("Login to rate this series.");
                          return;
                        }
                        const nextRating = index + 1;
                        setRating(nextRating);
                        try {
                          await rateNovel(session.token, novel.id, nextRating);
                        } catch (err) {
                          setNotice(err instanceof Error ? err.message : "Failed to rate.");
                        }
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                <p>
                  Your rating: {rating ? `${rating} / 5` : "Not rated yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Community comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{comment.name}</span>
                    <span>{comment.time}</span>
                  </div>
                  <p>{comment.note}</p>
                </div>
              ))}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Add a comment</p>
                <Textarea
                  placeholder="Share your thoughts"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    if (!commentText.trim() || !commentsChapterId) {
                      return;
                    }
                    if (!session) {
                      setNotice("Login to comment.");
                      return;
                    }
                    try {
                      await addComment(session.token, commentsChapterId, commentText.trim());
                      setCommentText("");
                      const data = await fetchComments(commentsChapterId);
                      setComments(
                        data.map((item) => ({
                          id: item.id,
                          name: `Reader ${item.userId}`,
                          note: item.body,
                          time: new Date(item.createdAt).toLocaleString(),
                        }))
                      );
                    } catch (err) {
                      setNotice(err instanceof Error ? err.message : "Failed to post comment.");
                    }
                  }}
                >
                  Post comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
