"use client";

import Link from "next/link";
import { Search, Trophy, BookOpenText } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { latestUpdates, translationNovels } from "@/lib/sample";
import { loadSession } from "@/lib/auth";

const parseCount = (value: string) => {
  const clean = value.toLowerCase().trim();
  if (clean.endsWith("k")) {
    const base = Number(clean.replace("k", ""));
    return Math.round(base * 1000);
  }
  return Number(clean.replace(/[^0-9]/g, ""));
};

export default function Home() {
  const session = loadSession();
  const isAdmin = session?.user.role === "admin";
  const rankings = [...translationNovels]
    .sort((a, b) => parseCount(b.follows) - parseCount(a.follows))
    .slice(0, 5);
  const newSeries = translationNovels.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <section className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Badge variant="subtle" className="w-fit">
              Malaz Translation Project
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Fast updates, clean reading, and zero distractions.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Track new chapters, follow translation teams, and read on any
              screen with a lightweight layout that keeps you focused.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90" asChild>
                <Link href="/library">Browse updates</Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/admin?tab=upload">Upload translation</Link>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, team, or origin..."
                className="border-none bg-transparent px-0 focus-visible:ring-0"
              />
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-foreground">180+</p>
                <p>Series updated</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">42</p>
                <p>Active teams</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">210k</p>
                <p>Followers</p>
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
                  key={update.slug}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{update.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Chapter {update.chapter} · {update.team}
                    </p>
                  </div>
                  <Badge variant="outline">{update.time}</Badge>
                </div>
              ))}
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
                <div
                  key={novel.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{novel.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {novel.team} · {novel.follows} follows
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{novel.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Continue reading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="text-base font-semibold text-foreground">Ashen Crown</p>
              <p>Last read: Chapter 63 · The Crown&apos;s Interpreter</p>
              <Button className="w-full" asChild>
                <Link href="/novels/ashen-crown">Resume</Link>
              </Button>
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
                    <Badge variant="outline">{novel.origin}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {novel.altTitle} · {novel.team}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>{novel.synopsis}</p>
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
