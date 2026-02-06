"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Palette, Sliders, Text } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chaptersBySlug, translationNovels } from "@/lib/sample";
import { recordReadingHistory } from "@/lib/api";
import { loadSession } from "@/lib/auth";

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
  const fallbackNovel = translationNovels[0];
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const chapterParam = Array.isArray(params.chapterId)
    ? params.chapterId[0]
    : params.chapterId;
  const resolvedSlug = slugParam ?? fallbackNovel.slug;
  const novel =
    translationNovels.find((item) => item.slug === resolvedSlug) ?? fallbackNovel;
  const chapters =
    chaptersBySlug[resolvedSlug] ??
    chaptersBySlug[fallbackNovel.slug] ??
    [];
  const chapterId = Number(chapterParam);
  const latestChapter = chapters[chapters.length - 1];
  const chapter =
    chapters.find((item) => item.id === chapterId) ??
    latestChapter ??
    chapters[0] ?? {
      id: 0,
      number: 0,
      title: "Chapter unavailable",
      words: 0,
      time: "",
      releasedAt: "",
      content: [
        "This chapter is not available yet. Try another chapter from the list.",
      ],
    };

  const [fontScale, setFontScale] = useState(1);
  const [width, setWidth] = useState<ReaderPrefs["width"]>("comfy");
  const [theme, setTheme] = useState<ReaderPrefs["theme"]>("night");
  const [showSettings, setShowSettings] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const prefsKey = `reader:${resolvedSlug}:prefs`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(prefsKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as ReaderPrefs;
      setFontScale(parsed.fontScale ?? 1);
      setWidth(parsed.width ?? "comfy");
      setTheme(parsed.theme ?? "night");
    } catch {
      window.localStorage.removeItem(prefsKey);
    }
  }, [prefsKey]);

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
    const session = loadSession();
    if (!session || !chapter.id) {
      return;
    }
    recordReadingHistory(session.token, {
      novelSlug: novel.slug,
      novelTitle: novel.title,
      chapterId: chapter.id,
      chapterTitle: `Chapter ${chapter.number}: ${chapter.title}`,
    }).catch(() => null);
  }, [chapter.id, chapter.number, chapter.title, novel.slug, novel.title]);

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
    window.setTimeout(() => setCopyStatus(""), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="outline">Reading mode</Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {novel.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Chapter {chapter.number}: {chapter.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/novels/${novel.slug}`}>Series page</Link>
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
                    <Link href={`/read/${novel.slug}/${previousChapter.id}`}>
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
                    <Link href={`/read/${novel.slug}/${nextChapter.id}`}>
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
                <span className="text-foreground">{chapter.words}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Release</span>
                <span className="text-foreground">{chapter.releasedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time</span>
                <span className="text-foreground">{chapter.time}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <div
            className={`mx-auto rounded-2xl border p-6 ${themeClasses[theme]} ${widthClass}`}
            style={{ fontSize: `${16 * fontScale}px`, lineHeight: 1.8 }}
          >
            {chapter.content.map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
