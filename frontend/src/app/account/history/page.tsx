"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchReadingHistory } from "@/lib/api";
import { clearSession, loadSession, type AuthSession } from "@/lib/auth";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HistoryItem = {
  id: number;
  novelSlug: string;
  novelTitle: string;
  chapterId: number;
  chapterTitle: string;
  readAt: string;
};

export default function ReadingHistoryPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
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
    fetchReadingHistory(loaded.token)
      .then((data) => setItems(data))
      .catch(() => setError("Unable to load history."))
      .finally(() => setLoading(false));
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Reading history</CardTitle>
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
              <CardTitle>Reading history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>You need an account to save and view reading history.</p>
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
            <h1 className="text-3xl font-semibold tracking-tight">Reading history</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.user.name}
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
          {loading && <p className="text-sm text-muted-foreground">Loading history...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Your reading history will appear here once you open chapters.
              </CardContent>
            </Card>
          )}
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">{item.novelTitle}</p>
                  <p className="font-medium">{item.chapterTitle}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.readAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Read</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/read/${item.novelSlug}/${item.chapterId}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
