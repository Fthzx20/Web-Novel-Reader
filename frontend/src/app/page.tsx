"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, Trophy, BookOpenText } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchNovels, fetchReadingHistory, fetchSiteSettings, type AdminNovel, type SiteSettings } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

const parseDate = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function Home() {
  const router = useRouter();
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentRead, setRecentRead] = useState<{
    novelSlug: string;
    novelTitle: string;
    chapterTitle: string;
  } | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchNovels()
      .then((data) => setNovels(data))
      .catch((err) =>
        setNotice(err instanceof Error ? err.message : "Failed to load updates.")
      );
  }, []);

  useEffect(() => {
    fetchSiteSettings()
      .then((settings) => setSiteSettings(settings))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    fetchReadingHistory(session.token)
      .then((items) => {
        if (!items.length) {
          return;
        }
        const latest = items[0];
        setRecentRead({
          novelSlug: latest.novelSlug,
          novelTitle: latest.novelTitle,
          chapterTitle: latest.chapterTitle,
        });
      })
      .catch(() => null);
  }, [session]);

  const novelsByUpdated = useMemo(() => {
    return [...novels].sort((a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt));
  }, [novels]);

  const rankings = useMemo(() => novelsByUpdated.slice(0, 5), [novelsByUpdated]);

  const newSeries = useMemo(() => {
    return [...novels]
      .sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt))
      .slice(0, 4);
  }, [novels]);

  const latestUpdates = useMemo(() => novelsByUpdated.slice(0, 5), [novelsByUpdated]);

  const authorCount = useMemo(() => {
    return new Set(novels.map((novel) => novel.author).filter(Boolean)).size;
  }, [novels]);

  const tagCount = useMemo(() => {
    const tags = new Set<string>();
    novels.forEach((novel) => {
      novel.tags.forEach((tag) => tags.add(tag));
    });
    return tags.size;
  }, [novels]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <section className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Badge
              variant="subtle"
              className="w-fit"
              style={siteSettings?.accentColor ? { backgroundColor: siteSettings.accentColor, color: "#111827" } : undefined}
            >
              {siteSettings?.highlightLabel || "Malaz Translation Project"}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              {siteSettings?.headline || "Fast updates, clean reading, and zero distractions."}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {siteSettings?.heroDescription ||
                "Track new chapters, follow translation teams, and read on any screen with a lightweight layout that keeps you focused."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                style={siteSettings?.accentColor ? { backgroundColor: siteSettings.accentColor } : undefined}
                asChild
              >
                <Link href="/library">{siteSettings?.primaryButton || "Browse updates"}</Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/admin">Upload translation</Link>
                </Button>
              )}
              {!isAdmin && siteSettings?.secondaryButton && (
                <Button variant="outline" asChild>
                  <Link href="/updates">{siteSettings.secondaryButton}</Link>
                </Button>
              )}
            </div>
            <form
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = searchQuery.trim();
                if (!trimmed) {
                  return;
                }
                router.push(`/library?query=${encodeURIComponent(trimmed)}`);
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, team, or origin..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="border-none bg-transparent px-0 focus-visible:ring-0"
              />
            </form>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-foreground">{novels.length}</p>
                <p>Series updated</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{authorCount}</p>
                <p>Active authors</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{tagCount}</p>
                <p>Genres tracked</p>
              </div>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Latest updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestUpdates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/40 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card/60">
                        {update.coverUrl ? (
                          <Image
                            src={resolveAssetUrl(update.coverUrl)}
                            alt={update.title}
                            width={36}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                            {update.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="font-medium">{update.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {update.updatedAt ? new Date(update.updatedAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{update.status}</Badge>
                </div>
              ))}
              {notice && (
                <p className="text-xs text-amber-200">{notice}</p>
              )}
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/library">View all updates</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Popular this week</CardTitle>
              <Trophy className="h-4 w-4 text-amber-200" />
            </CardHeader>
            <CardContent className="space-y-4">
              {rankings.map((novel, index) => (
                <Link
                  key={novel.id}
                  href={`/novels/${novel.slug}`}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card/60">
                      {novel.coverUrl ? (
                        <Image
                          src={resolveAssetUrl(novel.coverUrl)}
                          alt={novel.title}
                          width={32}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                          {novel.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{novel.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{novel.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Continue reading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {recentRead ? (
                <>
                  <p className="text-base font-semibold text-foreground">{recentRead.novelTitle}</p>
                  <p>Last read: {recentRead.chapterTitle}</p>
                  <Button className="w-full" asChild>
                    <Link href={`/novels/${recentRead.novelSlug}`}>Resume</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-foreground">No recent reads</p>
                  <p>Start a series to keep your progress here.</p>
                  <Button className="w-full" asChild>
                    <Link href="/library">Browse series</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpenText className="h-4 w-4 text-amber-200" />
            New series
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {newSeries.map((novel) => (
              <Card key={novel.id} className="hover:border-amber-200/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{novel.title}</CardTitle>
                    <Badge variant="outline">{novel.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {novel.author}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card/60">
                      {novel.coverUrl ? (
                        <Image
                          src={resolveAssetUrl(novel.coverUrl)}
                          alt={novel.title}
                          width={56}
                          height={80}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                          {novel.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="flex-1">{novel.summary ?? ""}</p>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/novels/${novel.slug}`}>Read series</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
