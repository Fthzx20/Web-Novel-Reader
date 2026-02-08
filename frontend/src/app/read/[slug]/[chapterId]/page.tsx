"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Palette, Sliders, Text } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChaptersByNovel, fetchNovels, recordReadingHistory, type AdminNovel, type Chapter } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { coerceContentToText } from "@/lib/plate-content";
import { resolveAssetUrl } from "@/lib/utils";

type ReaderPrefs = {
  fontScale: number;
  width: "narrow" | "comfy" | "wide";
  theme: "night" | "mist" | "paper";
};

const themeClasses: Record<ReaderPrefs["theme"], string> = {
  night: "bg-zinc-950 text-zinc-100 border-zinc-800/70",
  mist: "bg-zinc-900 text-zinc-100 border-zinc-800/70",
  paper: "bg-zinc-100 text-zinc-900 border-zinc-200",
};

export default function ReaderPage() {
  const params = useParams();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const chapterParam = Array.isArray(params.chapterId)
    ? params.chapterId[0]
    : params.chapterId;
  const resolvedSlug = slugParam ?? "";
  const chapterId = Number(chapterParam);
  const [novel, setNovel] = useState<AdminNovel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notice, setNotice] = useState("");
  const session = useAuthSession();

  useEffect(() => {
    if (!resolvedSlug) {
      return;
    }
    fetchNovels()
      .then((items) => {
        const found = items.find((item) => item.slug === resolvedSlug) ?? null;
        setNovel(found);
        if (found) {
          return fetchChaptersByNovel(found.id).then((data) => setChapters(data));
        }
        setChapters([]);
        return undefined;
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Failed to load chapter.");
      });
  }, [resolvedSlug]);

  const latestChapter = chapters[chapters.length - 1];
  const rawChapter =
    chapters.find((item) => item.id === chapterId) ??
    latestChapter ??
    chapters[0] ?? null;

  const normalizedContent = useMemo(() => {
    return rawChapter?.content ? coerceContentToText(rawChapter.content) : "";
  }, [rawChapter]);

  const chapterContent = useMemo(() => {
    if (!normalizedContent) {
      return ["This chapter is empty."];
    }
    const parts = normalizedContent.split(/\n\s*\n/).filter(Boolean);
    return parts.length ? parts : ["This chapter is empty."];
  }, [normalizedContent]);

  const chapter = useMemo(
    () =>
      rawChapter
        ? {
            id: rawChapter.id,
            number: rawChapter.number,
            volume: rawChapter.volume ?? 1,
            title: rawChapter.title,
            content: chapterContent,
          }
        : {
            id: 0,
            number: 0,
            volume: 1,
            title: "Chapter unavailable",
            content: [
              notice ||
                "This chapter is not available yet. Try another chapter from the list.",
            ],
          },
    [chapterContent, notice, rawChapter]
  );

  const chapterWords = useMemo(() => {
    return normalizedContent ? normalizedContent.trim().split(/\s+/).length : 0;
  }, [normalizedContent]);

  const chapterReadTime = useMemo(() => {
    return chapterWords ? `${Math.max(1, Math.round(chapterWords / 200))} min read` : "";
  }, [chapterWords]);

  const chapterRelease = rawChapter?.createdAt
    ? new Date(rawChapter.createdAt).toLocaleDateString()
    : "";

  const prefsKey = `reader:${resolvedSlug}:prefs`;
  const storedPrefs = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = window.localStorage.getItem(prefsKey);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as ReaderPrefs;
    } catch {
      window.localStorage.removeItem(prefsKey);
      return null;
    }
  }, [prefsKey]);

  const [fontScale, setFontScale] = useState(() => storedPrefs?.fontScale ?? 1);
  const [width, setWidth] = useState<ReaderPrefs["width"]>(
    () => storedPrefs?.width ?? "comfy"
  );
  const [theme, setTheme] = useState<ReaderPrefs["theme"]>(
    () => storedPrefs?.theme ?? "night"
  );
  const [showSettings, setShowSettings] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload: ReaderPrefs = {
      fontScale,
      width,
      theme,
    };
    window.localStorage.setItem(prefsKey, JSON.stringify(payload));
  }, [fontScale, width, theme, prefsKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!session || !chapter.id || !novel) {
      return;
    }
    recordReadingHistory(session.token, {
      novelSlug: novel.slug,
      novelTitle: novel.title,
      chapterId: chapter.id,
      chapterTitle: `Volume ${chapter.volume} · Chapter ${chapter.number}: ${chapter.title}`,
    }).catch(() => null);
  }, [chapter.id, chapter.number, chapter.title, chapter.volume, novel, session]);

  const widthClass =
    width === "narrow"
      ? "max-w-prose"
      : width === "wide"
        ? "max-w-4xl"
        : "max-w-3xl";

  const chapterIndex = useMemo(
    () => chapters.findIndex((item) => item.id === chapter.id),
    [chapters, chapter]
  );

  const previousChapter = chapters[chapterIndex - 1];
  const nextChapter = chapters[chapterIndex + 1];

  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("Link copied!");
    } catch {
      setCopyStatus("Copy failed");
    }
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => setCopyStatus(""), 2000);
  };

  const renderParagraph = (text: string, index: number) => {
    const parts = text.split(/(\[\[img:[^\]]+\]\])/g);
    return (
      <p key={index} className="mb-4 last:mb-0">
        {parts.map((part, partIndex) => {
          const match = part.match(/^\[\[img:(.+)\]\]$/);
          if (!match) {
            return <span key={partIndex}>{part}</span>;
          }
          const url = resolveAssetUrl(match[1]);
          return (
            <Image
              key={partIndex}
              src={url}
              alt="Illustration"
              width={1200}
              height={800}
              className="mx-auto my-6 block h-auto w-full max-w-3xl rounded-lg border border-border/40"
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized
            />
          );
        })}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="outline">Reading mode</Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {novel?.title ?? "Loading..."}
            </h1>
            <p className="text-sm text-muted-foreground">
              Volume {chapter.volume} · Chapter {chapter.number}: {chapter.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={novel ? `/novels/${novel.slug}` : "/library"}>Series page</Link>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowSettings((current) => !current)}
              aria-expanded={showSettings}
              aria-controls="reader-settings"
            >
              <Sliders className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            {copyStatus && (
              <span className="text-xs text-muted-foreground">{copyStatus}</span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card
            id="reader-settings"
            className={showSettings ? "block" : "hidden"}
          >
            <CardHeader>
              <CardTitle>Reading controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="hidden flex-wrap items-center gap-3 sm:flex">
                <Text className="h-4 w-4" />
                {[0.95, 1, 1.1, 1.2].map((scale) => (
                  <Button
                    key={scale}
                    size="sm"
                    variant={fontScale === scale ? "secondary" : "outline"}
                    onClick={() => setFontScale(scale)}
                  >
                    {scale}x
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span>Line width</span>
                {([
                  ["narrow", "Narrow"],
                  ["comfy", "Comfy"],
                  ["wide", "Wide"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={width === value ? "secondary" : "outline"}
                    onClick={() => setWidth(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Palette className="h-4 w-4" />
                {([
                  ["night", "Night"],
                  ["mist", "Mist"],
                  ["paper", "Paper"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={theme === value ? "secondary" : "outline"}
                    onClick={() => setTheme(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!previousChapter}
                  asChild={Boolean(previousChapter)}
                >
                  {previousChapter ? (
                    <Link href={novel ? `/read/${novel.slug}/${previousChapter.id}` : "#"}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Prev
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Prev
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!nextChapter}
                  asChild={Boolean(nextChapter)}
                >
                  {nextChapter ? (
                    <Link href={novel ? `/read/${novel.slug}/${nextChapter.id}` : "#"}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chapter info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Words</span>
                <span className="text-foreground">{chapterWords || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Release</span>
                <span className="text-foreground">{chapterRelease || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time</span>
                <span className="text-foreground">{chapterReadTime || "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <div
            className={`mx-auto rounded-2xl border p-6 ${themeClasses[theme]} ${widthClass}`}
            style={{ fontSize: `${16 * fontScale}px`, lineHeight: 1.8 }}
          >
            {chapter.content.map((paragraph, index) =>
              renderParagraph(paragraph, index)
            )}
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={!previousChapter}
            asChild={Boolean(previousChapter)}
          >
            {previousChapter ? (
              novel ? (
                <Link href={`/read/${novel.slug}/${previousChapter.id}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </span>
              )
            ) : (
              <span>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </span>
            )}
          </Button>
          <Button variant="outline" asChild={Boolean(novel)}>
            {novel ? <Link href={`/novels/${novel.slug}`}>ToC</Link> : <span>ToC</span>}
          </Button>
          <Button
            variant="outline"
            disabled={!nextChapter}
            asChild={Boolean(nextChapter)}
          >
            {nextChapter ? (
              novel ? (
                <Link href={`/read/${novel.slug}/${nextChapter.id}`}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              )
            ) : (
              <span>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
