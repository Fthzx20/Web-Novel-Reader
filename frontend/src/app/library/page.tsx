"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Clock, Flame, SlidersHorizontal, Star } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { fetchNovels, followNovel, unfollowNovel, type AdminNovel } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Title", value: "title" },
];

const parseDate = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toDateKey = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toDateString();
};

function LibraryContent() {
  const searchParams = useSearchParams();
  const session = useAuthSession();
  const [query, setQuery] = useState(() => searchParams.get("query") ?? "");
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [followed, setFollowed] = useState<Record<number, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [novels, setNovels] = useState<AdminNovel[]>([]);

  useEffect(() => {
    fetchNovels()
      .then((data) => setNovels(data))
      .catch((err) =>
        setNotice(err instanceof Error ? err.message : "Unable to load library.")
      );
  }, []);

  const filteredNovels = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    const items = novels.filter((novel) => {
      const matchesQuery =
        novel.title.toLowerCase().includes(lowerQuery) ||
        novel.author.toLowerCase().includes(lowerQuery) ||
        novel.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
      const matchesStatus =
        activeStatus === "All" || novel.status === activeStatus;
      const matchesTag = activeTag === "All" || novel.tags.includes(activeTag);
      return matchesQuery && matchesStatus && matchesTag;
    });

    return [...items].sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return parseDate(b.updatedAt) - parseDate(a.updatedAt);
    });
  }, [novels, query, activeStatus, activeTag, sortBy]);

  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(novels.map((novel) => novel.status).filter(Boolean)));
    return unique.length ? unique : ["Ongoing", "Hiatus", "Completed"];
  }, [novels]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    novels.forEach((novel) => {
      novel.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [novels]);

  const authorCount = useMemo(() => {
    return new Set(novels.map((novel) => novel.author).filter(Boolean)).size;
  }, [novels]);

  const updatedToday = useMemo(() => {
    const todayKey = new Date().toDateString();
    return novels.filter((novel) => toDateKey(novel.updatedAt) === todayKey).length;
  }, [novels]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="subtle" className="w-fit">
              Latest updates
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Fresh chapters from the community
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Quick filters, compact rows, and a layout optimized for mobile
              reading.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Search + filters</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search title, author, or tag"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
                {filtersOpen && (
                  <div className="space-y-4 rounded-lg border border-border/40 bg-card/60 p-4">
                    <div className="flex flex-wrap gap-2">
                      {["All", ...statusOptions].map((status) => (
                        <Button
                          key={status}
                          variant={activeStatus === status ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setActiveStatus(status)}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["All", ...tagOptions].map((tag) => (
                        <Button
                          key={tag}
                          variant={activeTag === tag ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setActiveTag(tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={sortBy === option.value ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setSortBy(option.value)}
                        >
                          Sort: {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {notice && <p className="text-xs text-amber-200">{notice}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Flame className="h-4 w-4 text-amber-200" />
                  {updatedToday} series updated today
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-amber-200" />
                  {authorCount} active authors
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-amber-200" />
                  {tagOptions.length} genres tracked
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Separator className="my-10" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredNovels.length} series</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setActiveStatus("All");
              setActiveTag("All");
              setSortBy("latest");
            }}
          >
            Clear filters
          </Button>
        </div>
        <div className="mt-6 space-y-4">
          {filteredNovels.map((novel) => {
            const coverUrl = resolveAssetUrl(novel.coverUrl ?? "");
            return (
              <Card key={novel.id} className="hover:border-amber-200/40">
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div
                      className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card/60"
                      aria-hidden
                    >
                      {novel.coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={novel.title}
                          width={80}
                          height={112}
                          className="h-full w-full rounded-xl object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {novel.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">
                          {novel.title}
                        </p>
                        <Badge variant="outline">{novel.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {novel.author}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {novel.tags.map((tag) => (
                          <Badge key={tag} variant="subtle">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span>
                      Updated {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/novels/${novel.slug}`}>Read</Link>
                      </Button>
                      <Button
                        variant={followed[novel.id] ? "secondary" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          if (!session) {
                            setNotice("Login to follow series.");
                            return;
                          }
                          const next = !followed[novel.id];
                          setFollowed((current) => ({
                            ...current,
                            [novel.id]: next,
                          }));
                          try {
                            if (next) {
                              await followNovel(session.token, novel.id);
                            } else {
                              await unfollowNovel(session.token, novel.id);
                            }
                          } catch (err) {
                            setNotice(
                              err instanceof Error ? err.message : "Failed to update follow."
                            );
                          }
                        }}
                      >
                        {followed[novel.id] ? "Following" : "Follow"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background text-foreground" />}
    >
      <LibraryContent />
    </Suspense>
  );
}
