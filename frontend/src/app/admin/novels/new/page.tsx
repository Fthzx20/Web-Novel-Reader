"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNovelAdmin, uploadNovelCover } from "@/lib/api";
import { loadSession } from "@/lib/auth";

type Draft = {
  id: number;
  title: string;
  author: string;
  origin: string;
  team: string;
  status: "Draft" | "Published";
};

export default function NewNovelPage() {
  const [session] = useState(() => loadSession());
  const isAdmin = session?.user.role === "admin";
  const [form, setForm] = useState({
    title: "",
    altTitle: "",
    origin: "",
    author: "",
    team: "",
    language: "EN",
    tags: "",
    synopsis: "",
    age: "",
  });
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in with an admin account to manage projects.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const saveDraft = async (status: Draft["status"]) => {
    if (!form.title || !form.author || !form.origin || !form.team) {
      setNotice("Title, author, origin, and team are required.");
      return;
    }
    try {
      await createNovelAdmin({
        title: form.title,
        author: form.author,
        summary: form.synopsis || "No summary provided.",
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: status === "Published" ? "published" : "draft",
        coverUrl,
      });
      setDrafts((current) => [
        {
          id: Date.now(),
          title: form.title,
          author: form.author,
          origin: form.origin,
          team: form.team,
          status,
        },
        ...current,
      ]);
      setNotice("Saved to backend.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            New project
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Add a new series</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create a series profile, upload a cover, and publish when you are ready.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Series details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notice && <p className="text-sm text-amber-200">{notice}</p>}
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
              <Input
                placeholder="Alt title"
                value={form.altTitle}
                onChange={(event) => setForm((current) => ({ ...current, altTitle: event.target.value }))}
              />
              <Input
                placeholder="Origin"
                value={form.origin}
                onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))}
              />
              <Input
                placeholder="Author"
                value={form.author}
                onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              />
              <Input
                placeholder="Translation team"
                value={form.team}
                onChange={(event) => setForm((current) => ({ ...current, team: event.target.value }))}
              />
              <Input
                placeholder="Language"
                value={form.language}
                onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              />
              <Textarea
                placeholder="Synopsis"
                value={form.synopsis}
                onChange={(event) => setForm((current) => ({ ...current, synopsis: event.target.value }))}
              />
              <Input
                placeholder="Age rating"
                value={form.age}
                onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Cover upload</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    if (coverPreview) {
                      URL.revokeObjectURL(coverPreview);
                    }
                    const preview = URL.createObjectURL(file);
                    setCoverPreview(preview);
                    setCoverName(file.name);
                    try {
                      const uploadedUrl = await uploadNovelCover(file);
                      setCoverUrl(uploadedUrl);
                      setNotice("Cover uploaded.");
                    } catch (err) {
                      setNotice(err instanceof Error ? err.message : "Cover upload failed.");
                    }
                  }}
                />
                <Input
                  placeholder="Cover URL"
                  value={coverUrl}
                  onChange={(event) => setCoverUrl(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={() => saveDraft("Draft")}>
                  <ShieldCheck className="h-4 w-4" />
                  Save draft
                </Button>
                <Button
                  className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                  onClick={() => saveDraft("Published")}
                >
                  <FileUp className="h-4 w-4" />
                  Publish series
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-base font-semibold text-foreground">
                {form.title || "Untitled series"}
              </p>
              <p>{form.author || "Unknown author"}</p>
              <p>{form.team || "No team assigned"}</p>
              <p>{form.origin || "Origin pending"}</p>
              <p>{form.tags || "No tags"}</p>
              {coverPreview ? (
                <div className="flex items-center gap-3 rounded-md border border-border/60 p-2">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    width={64}
                    height={96}
                    className="h-24 w-16 object-cover"
                    unoptimized
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">{coverName ?? "Cover preview"}</p>
                    <p className="text-xs text-muted-foreground">{coverUrl || "No URL yet"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Upload a cover to preview.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Recent drafts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {drafts.length === 0 && <p>No drafts yet.</p>}
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{draft.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {draft.author} · {draft.origin} · {draft.team}
                  </p>
                </div>
                <Badge variant={draft.status === "Published" ? "default" : "outline"}>
                  {draft.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
