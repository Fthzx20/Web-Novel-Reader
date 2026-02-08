"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, Link as LinkIcon, MessageSquare, Users } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchAnnouncements,
  fetchNovels,
  fetchSiteSettings,
  fetchUsers,
  type AdminNovel,
  type UserSummary,
} from "@/lib/api";

type Announcement = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

const RECENT_CUTOFF = Date.now() - 30 * 24 * 60 * 60 * 1000;

export default function UpdatesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notice, setNotice] = useState("");
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [socialLinks, setSocialLinks] = useState<Array<{ label: string; url: string }>>([
    { label: "Facebook", url: "" },
    { label: "Discord", url: "" },
  ]);

  useEffect(() => {
    fetchAnnouncements()
      .then((data) => setAnnouncements(data))
      .catch(() => setNotice("Unable to load announcements."));
    fetchNovels()
      .then((data) => setNovels(data))
      .catch(() => null);
    fetchUsers()
      .then((data) => setUsers(data))
      .catch(() => null);
    fetchSiteSettings()
      .then((settings) =>
        setSocialLinks([
          { label: "Facebook", url: settings.facebookUrl || "" },
          { label: "Discord", url: settings.discordUrl || "" },
        ])
      )
      .catch(() => null);
  }, []);

  const joinRate = useMemo(() => {
    if (!users.length) {
      return 0;
    }
    const recent = users.filter((user) => Date.parse(user.createdAt) >= RECENT_CUTOFF).length;
    return Math.round((recent / users.length) * 100);
  }, [users]);

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
                      Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ""}
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
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
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
                <Users className="h-4 w-4" />
                Release cadence
              </div>
              {joinRate}% of readers joined in the last 30 days.
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-amber-200">
                <Clock className="h-4 w-4" />
                Schedule updates
              </div>
              Follow the owner social feeds for schedule drops.
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((item) =>
                  item.url ? (
                    <Button key={item.label} size="sm" variant="outline" asChild>
                      <Link href={item.url} target="_blank" rel="noreferrer">
                        <LinkIcon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ) : (
                    <span key={item.label} className="text-xs text-muted-foreground">
                      {item.label} link pending
                    </span>
                  )
                )}
              </div>
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
