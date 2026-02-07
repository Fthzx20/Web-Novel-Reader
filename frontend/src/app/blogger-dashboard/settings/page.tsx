import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function BloggerSettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_10%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(800px_circle_at_90%_0%,rgba(56,189,248,0.14),transparent_40%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-amber-200 text-zinc-900">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Blogger Studio
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Website settings
                </h1>
              </div>
            </div>
            <Button variant="outline" asChild className="w-full gap-2 sm:w-auto">
              <Link href="/blogger-dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </header>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Brand and homepage</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the public site experience. Changes will be saved later.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Branding
                  </p>
                  <Input placeholder="Site title" defaultValue="Malaz Translation" />
                  <Input placeholder="Tagline" defaultValue="Fast updates, clean reading." />
                  <Input type="file" accept="image/*" />
                  <Input placeholder="Logo alt text" defaultValue="Malaz logo" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Homepage hero
                  </p>
                  <Input placeholder="Headline" defaultValue="Fast updates, clean reading, and zero distractions." />
                  <Textarea
                    placeholder="Hero description"
                    defaultValue="Track new chapters, follow translation teams, and read on any screen with a lightweight layout that keeps you focused."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Navigation
                  </p>
                  <Input placeholder="Primary button" defaultValue="Start reading" />
                  <Input placeholder="Secondary button" defaultValue="Browse updates" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Visual style
                  </p>
                  <Input placeholder="Accent color" defaultValue="#FBBF24" />
                  <Input placeholder="Highlight label" defaultValue="Malaz Translation Project" />
                  <div className="flex flex-wrap gap-2">
                    {["Amber", "Sky", "Emerald", "Slate"].map((tone) => (
                      <Badge key={tone} variant="subtle">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90 sm:w-auto">
                    Save settings
                  </Button>
                  <Button variant="outline" className="sm:w-auto">
                    Preview changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
