"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookmarkCheck } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chaptersBySlug, translationNovels } from "@/lib/sample";
import { updateNovelAdmin, uploadNovelCover } from "@/lib/api";
import { loadSession } from "@/lib/auth";

type ChapterItem = {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
};

export default function EditNovelPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const novel = translationNovels[0];
  const [status, setStatus] = useState(novel.status);
  const [title, setTitle] = useState(novel.title);
  const [team, setTeam] = useState(novel.team);
  const [tags, setTags] = useState(novel.tags.join(", "));
  const [synopsis, setSynopsis] = useState(novel.synopsis);
  const [coverUrl, setCoverUrl] = useState((novel as { coverUrl?: string }).coverUrl ?? "");
  const [notice, setNotice] = useState("");
  const [chapters, setChapters] = useState<ChapterItem[]>(
    (chaptersBySlug[novel.slug] ?? []).map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      releasedAt: chapter.releasedAt,
    }))
  );

  useEffect(() => {
    const session = loadSession();
    setIsAdmin(session?.user.role === "admin");
    setChecked(true);
  }, []);

  if (checked && !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in with an admin account to edit projects.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const moveChapter = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= chapters.length) {
      return;
    }
    setChapters((current) => {
      const clone = [...current];
      const temp = clone[index];
      clone[index] = clone[nextIndex];
      clone[nextIndex] = temp;
      return clone;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Edit project
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Update details</h1>
          <p className="text-muted-foreground">
            Adjust metadata, reorder chapters, or archive the translation.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Project metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notice && <p className="text-sm text-amber-200">{notice}</p>}
              <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <Input placeholder="Alt title" defaultValue={novel.altTitle} />
              <Input placeholder="Translation team" value={team} onChange={(event) => setTeam(event.target.value)} />
              <Input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  try {
                    const uploadedUrl = await uploadNovelCover(file);
                    setCoverUrl(uploadedUrl);
                    setNotice("Cover uploaded.");
                  } catch (err) {
                    setNotice(err instanceof Error ? err.message : "Cover upload failed.");
                  }
                }}
              />
              <Input placeholder="Cover URL" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} />
              <Input placeholder="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
              <Textarea placeholder="Synopsis" value={synopsis} onChange={(event) => setSynopsis(event.target.value)} />
              <div className="flex flex-wrap gap-3">
                <Button
                  className="gap-2"
                  onClick={async () => {
                    if (!title.trim()) {
                      setNotice("Title is required.");
                      return;
                    }
                    try {
                      await updateNovelAdmin(novel.id, {
                        title,
                        author: novel.author,
                        summary: synopsis || "No summary provided.",
                        tags: tags
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                        status: status.toLowerCase(),
                        coverUrl,
                      });
                      setNotice("Updated successfully.");
                    } catch (err) {
                      setNotice(err instanceof Error ? err.message : "Update failed.");
                    }
                  }}
                >
                  <BookmarkCheck className="h-4 w-4" />
                  Update project
                </Button>
                <Button
                  variant={status === "Hiatus" ? "secondary" : "outline"}
                  onClick={() =>
                    setStatus((current) =>
                      current === "Hiatus" ? "Ongoing" : "Hiatus"
                    )
                  }
                >
                  {status === "Hiatus" ? "Resume" : "Set hiatus"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Project status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-base font-semibold text-foreground">
                {novel.title}
              </p>
              <p>
                {novel.team} · {novel.origin} · {status}
              </p>
              <p>Latest chapter: {novel.latestChapter}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Chapter order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Chapter {chapter.number}: {chapter.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Released {chapter.releasedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, "down")}
                    disabled={index === chapters.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
