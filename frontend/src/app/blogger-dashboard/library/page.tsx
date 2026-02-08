"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, FileText, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/plate/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/plate/components/ui/dropdown-menu";
import {
  createNovelAdmin,
  deleteNovelAdmin,
  fetchNovelsAdmin,
  uploadNovelCover,
  type AdminNovel,
} from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { resolveAssetUrl } from "@/lib/utils";

export default function BloggerLibraryPage() {
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [notice, setNotice] = useState("");
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newStatus, setNewStatus] = useState("Ongoing");
  const [newPostNotice, setNewPostNotice] = useState("");
  const statusOptions = ["Hiatus", "Completed", "Ongoing", "Axed", "Dropped"];

  const loadNovels = async () => {
    try {
      const data = await fetchNovelsAdmin();
      setNovels(data);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load library.");
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    fetchNovelsAdmin()
      .then((data) => setNovels(data))
      .catch((err) =>
        setNotice(err instanceof Error ? err.message : "Failed to load library.")
      );
  }, [session]);

  const handleCreateNovel = async () => {
    if (!isAdmin) {
      setNewPostNotice("Admin access required.");
      return;
    }
    const trimmedTitle = newTitle.trim();
    const trimmedAuthor = newAuthor.trim();
    const trimmedSummary = newSummary.trim();
    if (!trimmedTitle || !trimmedAuthor || !trimmedSummary) {
      setNewPostNotice("Title, author, and synopsis are required.");
      return;
    }
    setNewPostNotice("");
    try {
      let coverUrl = "";
      if (newCoverFile) {
        coverUrl = await uploadNovelCover(newCoverFile);
      }
      const tagList = newTags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (newLanguage.trim()) {
        tagList.push(`Language: ${newLanguage.trim()}`);
      }
      await createNovelAdmin({
        title: trimmedTitle,
        author: trimmedAuthor,
        summary: trimmedSummary,
        tags: tagList,
        status: newStatus,
        coverUrl: coverUrl || undefined,
      });
      setNewTitle("");
      setNewAuthor("");
      setNewLanguage("");
      setNewTags("");
      setNewSummary("");
      setNewCoverFile(null);
      setNewStatus("Ongoing");
      setNewPostOpen(false);
      await loadNovels();
    } catch (err) {
      setNewPostNotice(err instanceof Error ? err.message : "Failed to create novel.");
    }
  };

  const sortedNovels = useMemo(() => {
    return [...novels].sort((a, b) => {
      const aTime = Date.parse(a.updatedAt);
      const bTime = Date.parse(b.updatedAt);
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [novels]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_10%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(800px_circle_at_90%_0%,rgba(56,189,248,0.14),transparent_40%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:py-14">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Blogger Studio
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Novel library</h1>
              <p className="text-sm text-muted-foreground">
                Full list of created projects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="gap-2">
                <Link href="/blogger-dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
              <Button
                className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
                onClick={() => setNewPostOpen(true)}
              >
                <FileText className="h-4 w-4" />
                New novel
              </Button>
            </div>
          </header>

          {notice && <p className="text-sm text-amber-200">{notice}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {sortedNovels.map((novel) => {
              const coverUrl = novel.coverUrl ? resolveAssetUrl(novel.coverUrl) : "";
              return (
                <Card key={novel.id} className="border-border/60 bg-card/80">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-background/60">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={novel.title}
                            width={64}
                            height={96}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                            {novel.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{novel.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {novel.author} · Updated{" "}
                          {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {novel.status && <Badge variant="outline">{novel.status}</Badge>}
                          {novel.tags.map((tag) => (
                            <Badge key={tag} variant="subtle">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {novel.summary || "No summary yet."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/novels/${novel.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-500 hover:text-red-600"
                        disabled={!isAdmin}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Delete this novel? This will remove the novel and all chapters."
                          );
                          if (!confirmed) {
                            return;
                          }
                          try {
                            await deleteNovelAdmin(novel.id);
                            setNovels((current) =>
                              current.filter((entry) => entry.id !== novel.id)
                            );
                          } catch (err) {
                            setNotice(
                              err instanceof Error ? err.message : "Delete failed."
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create new novel</DialogTitle>
            <DialogDescription>
              Draft a new series entry. It will appear in the library for chapter writing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Novel title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <Input
              placeholder="Author"
              value={newAuthor}
              onChange={(event) => setNewAuthor(event.target.value)}
            />
            <Input
              placeholder="Language"
              value={newLanguage}
              onChange={(event) => setNewLanguage(event.target.value)}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={newTags}
              onChange={(event) => setNewTags(event.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setNewCoverFile(file);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Status: {newStatus}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuRadioGroup
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value)}
                >
                  {statusOptions.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {option}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            placeholder="Synopsis"
            value={newSummary}
            onChange={(event) => setNewSummary(event.target.value)}
            rows={4}
          />
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Author: {newAuthor || "-"}</span>
            <span>Language: {newLanguage || "-"}</span>
            <span>Tags: {newTags || "-"}</span>
          </div>
          {newPostNotice && <p className="text-sm text-amber-200">{newPostNotice}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewPostOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-amber-200 text-zinc-950 hover:bg-amber-200/90"
              onClick={handleCreateNovel}
            >
              <Plus className="h-4 w-4" />
              Create novel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
