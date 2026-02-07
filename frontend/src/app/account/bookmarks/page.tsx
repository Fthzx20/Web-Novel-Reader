"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchBookmarks, fetchNovels, type AdminNovel, type BookmarkEntry } from "@/lib/api";
import { clearSession, loadSession, type AuthSession } from "@/lib/auth";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAssetUrl } from "@/lib/utils";

export default function BookmarksPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
    setChecked(true);
    if (!loaded) {
      setLoading(false);
      return;
    }
    Promise.all([fetchBookmarks(loaded.token), fetchNovels()])
      .then(([bookmarkData, novelData]) => {
        setBookmarks(bookmarkData);
        setNovels(novelData);
      })
      .catch(() => setError("Unable to load bookmarks."))
      .finally(() => setLoading(false));
  }, []);

  const bookmarkedNovels = useMemo(() => {
    const novelMap = new Map(novels.map((novel) => [novel.id, novel]));
    return bookmarks
      .map((bookmark) => ({
        bookmark,
        novel: novelMap.get(bookmark.novelId) ?? null,
      }))
      .sort((a, b) => {
        const aTime = Date.parse(a.bookmark.createdAt);
        const bTime = Date.parse(b.bookmark.createdAt);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
  }, [bookmarks, novels]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Bookmarks</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Loading session...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Bookmarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>You need an account to save and view bookmarks.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <Link href="/auth/sign-in">Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bookmarks</h1>
            <p className="text-sm text-muted-foreground">
              Saved series for {session.user.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Back</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearSession();
                window.location.href = "/";
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {loading && <p className="text-sm text-muted-foreground">Loading bookmarks...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && bookmarkedNovels.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Bookmark a series to keep it here.
              </CardContent>
            </Card>
          )}
          {bookmarkedNovels.map(({ bookmark, novel }) => {
            const coverUrl = novel?.coverUrl ? resolveAssetUrl(novel.coverUrl) : "";
            const title = novel?.title ?? "Unknown series";
            return (
              <Card key={bookmark.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-14 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-card/60">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">{title.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(bookmark.createdAt).toLocaleString()}
                      </p>
                      <p className="font-medium">{title}</p>
                      {novel?.author && (
                        <p className="text-xs text-muted-foreground">{novel.author}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {novel?.status && <Badge variant="outline">{novel.status}</Badge>}
                    {novel ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/novels/${novel.slug}`}>Open</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Unavailable
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
