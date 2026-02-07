"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, BookmarkCheck, ChevronDown } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchChaptersByNovel,
  fetchNovel,
  deleteChapterAdmin,
  deleteNovelAdmin,
  updateChapterAdmin,
  updateNovelAdmin,
  uploadNovelCover,
  type AdminNovel,
} from "@/lib/api";
import { loadSession } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/plate/components/ui/dropdown-menu";

type ChapterItem = {
  id: number;
  number: number;
  title: string;
  content: string;
  releasedAt: string;
};

export default function EditNovelPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const params = useParams();
  const router = useRouter();
  const novelId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const [novel, setNovel] = useState<AdminNovel | null>(null);
  const [status, setStatus] = useState("Ongoing");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [metadataOpen, setMetadataOpen] = useState(true);
  const statusOptions = ["Hiatus", "Completed", "Ongoing", "Axed", "Dropped"];
  const [chapters, setChapters] = useState<ChapterItem[]>(
    []
  );
  const resolvedCoverUrl = coverUrl ? resolveAssetUrl(coverUrl) : "";

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
  useEffect(() => {
    if (!novelId) {
      return;
    }
    Promise.all([fetchNovel(novelId), fetchChaptersByNovel(novelId)])
      .then(([novelData, chapterData]) => {
        setNovel(novelData);
        setStatus(novelData.status || "Ongoing");
        setTitle(novelData.title || "");
        setAuthor(novelData.author || "");
        setSlug(novelData.slug || "");
        setTags((novelData.tags ?? []).join(", "));
        setSynopsis(novelData.summary || "");
        setCoverUrl(novelData.coverUrl || "");
        setChapters(
          chapterData.map((chapter) => ({
            id: chapter.id,
            number: chapter.number,
            title: chapter.title,
            content: chapter.content,
            releasedAt: chapter.createdAt
              ? new Date(chapter.createdAt).toLocaleDateString()
              : "",
          }))
        );
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Failed to load project.");
      });
  }, [novelId]);

  const moveChapter = async (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= chapters.length) {
      return;
    }
    const previous = chapters;
    const clone = [...previous];
    const current = clone[index];
    const target = clone[nextIndex];
    clone[index] = { ...current, number: target.number };
    clone[nextIndex] = { ...target, number: current.number };
    setChapters(clone);
    try {
      await Promise.all([
        updateChapterAdmin(current.id, {
          number: clone[index].number,
          title: current.title,
          content: current.content,
        }),
        updateChapterAdmin(target.id, {
          number: clone[nextIndex].number,
          title: target.title,
          content: target.content,
        }),
      ]);
      setNotice("Chapter order updated.");
    } catch (err) {
      setChapters(previous);
      setNotice(err instanceof Error ? err.message : "Failed to update chapter order.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <Badge variant="subtle" className="w-fit">
            Edit project
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Update details</h1>
          <p className="text-muted-foreground">
            Adjust metadata, reorder chapters, or archive the translation.
          </p>
        </div>
        <div className="mt-10 space-y-6">
          <Card className="border-amber-200/40">
            <CardHeader>
              <CardTitle>Project status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground sm:flex-row">
              <div className="space-y-3">
                <p className="text-base font-semibold text-foreground">
                  {novel?.title ?? "Loading..."}
                </p>
                <p>
                  {author || "Unknown author"} · {status}
                </p>
                <p>
                  Latest chapter:{" "}
                  {chapters.length
                    ? Math.max(...chapters.map((chapter) => chapter.number))
                    : "-"}
                </p>
              </div>
              <div className="h-40 w-28 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card/60">
                {resolvedCoverUrl ? (
                  <img
                    src={resolvedCoverUrl}
                    alt={novel?.title ?? "Novel cover"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Project metadata</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setMetadataOpen((current) => !current)}
              >
                {metadataOpen ? "Hide" : "Show"} metadata
              </Button>
            </CardHeader>
            {metadataOpen && (
              <CardContent className="space-y-4">
                {notice && <p className="text-sm text-amber-200">{notice}</p>}
                <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
                <Input placeholder="Author" value={author} onChange={(event) => setAuthor(event.target.value)} />
                <Input placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
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
                <Input placeholder="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
                <Textarea placeholder="Synopsis" value={synopsis} onChange={(event) => setSynopsis(event.target.value)} />
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full gap-2 sm:w-auto"
                    onClick={async () => {
                      if (!title.trim()) {
                        setNotice("Title is required.");
                        return;
                      }
                      try {
                        await updateNovelAdmin(novelId, {
                          title,
                          author,
                          summary: synopsis || "No summary provided.",
                          tags: tags
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                          status: status.toLowerCase(),
                          slug: slug.trim() || undefined,
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 sm:w-auto">
                        Status: {status}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[180px]">
                      <DropdownMenuRadioGroup
                        value={status}
                        onValueChange={(value) => setStatus(value)}
                      >
                        {statusOptions.map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {option}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600 sm:w-auto"
                    onClick={async () => {
                      if (!novelId) {
                        return;
                      }
                      const confirmed = window.confirm(
                        "Delete this project? This will remove the novel and all chapters."
                      );
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await deleteNovelAdmin(novelId);
                        router.push("/admin");
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Delete failed.");
                      }
                    }}
                  >
                    Delete project
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Write chapter</CardTitle>
              <Button variant="outline" size="sm" disabled>
                Rich text editor (soon)
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Draft new chapters here once the rich text editor is ready.
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={async () => {
                      const confirmed = window.confirm("Delete this chapter?");
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await deleteChapterAdmin(chapter.id);
                        setChapters((current) =>
                          current.filter((entry) => entry.id !== chapter.id)
                        );
                      } catch (err) {
                        setNotice(err instanceof Error ? err.message : "Delete failed.");
                      }
                    }}
                  >
                    Delete
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
