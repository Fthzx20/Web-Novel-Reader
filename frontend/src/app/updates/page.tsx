"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, Flame, MessageSquare } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAnnouncements, fetchNovels } from "@/lib/api";

type Announcement = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

export default function UpdatesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notice, setNotice] = useState("");
  const [novels, setNovels] = useState<
    Array<{
      id: number;
      slug: string;
      title: string;
      latestChapter: number;
      updatedAt: string;
      team: string;
    }>
  >([]);

  useEffect(() => {
    fetchAnnouncements()
      .then((data) => setAnnouncements(data))
      .catch(() => setNotice("Unable to load announcements."));
    fetchNovels()
      .then((data) =>
        setNovels(
          data.map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            latestChapter: item.latestChapter ?? 0,
            updatedAt: item.updatedAt ?? "",
            team: item.team,
          }))
        )
      )
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Update feed
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Latest releases and announcements
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Follow translator notes, release cadence, and platform updates.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Latest chapters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {novels.length === 0 && (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              )}
              {novels.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Chapter {item.latestChapter} · {item.updatedAt}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/novels/${item.slug}`}>Open</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {notice && <p className="text-xs text-amber-200">{notice}</p>}
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              )}
              {announcements.map((item) => (
                <div key={item.id} className="space-y-2 rounded-lg border border-border/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-amber-200">
                <Flame className="h-4 w-4" />
                Release cadence
              </div>
              Weekly drops and targeted batch updates for major arcs.
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-amber-200">
                <Clock className="h-4 w-4" />
                Schedule updates
              </div>
              Refresh often for bonus chapters and seasonal specials.
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-amber-200">
                <MessageSquare className="h-4 w-4" />
                Community notes
              </div>
              Check admin announcements for translation notes and site changes.
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
