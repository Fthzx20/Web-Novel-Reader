"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenText, Crown, Flame, Menu, User, X, History, Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/auth";
import { useAuthSession } from "@/lib/use-auth-session";
import { fetchSiteSettings } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/utils";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const session = useAuthSession();
  const [siteTitle, setSiteTitle] = useState("Malaz Translation");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const resolvedLogoUrl = logoUrl ? resolveAssetUrl(logoUrl) : null;
  const isSignedIn = Boolean(session);
  const displayName = session?.user.name ?? "Profile";
  const isAdmin = session?.user.role === "admin";
  const displayRole = isAdmin ? "Admin" : "";

  useEffect(() => {
    fetchSiteSettings()
      .then((settings) => {
        setSiteTitle(settings.title || "Malaz Translation");
        setLogoUrl(settings.logoUrl || null);
      })
      .catch(() => null);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/80">
            {resolvedLogoUrl ? <Image src={resolvedLogoUrl} alt="Site logo" width={24} height={24} className="h-6 w-6 rounded-md object-cover" unoptimized /> : <BookOpenText className="h-5 w-5 text-amber-200" />}
          </span>
          <span className="tracking-tight">{siteTitle}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/updates" className="flex items-center gap-2 hover:text-foreground">
            <Flame className="h-4 w-4" />
            Updates
          </Link>
          <Link href="/library" className="flex items-center gap-2 hover:text-foreground">
            <BookOpenText className="h-4 w-4" />
            Series
          </Link>
          {isSignedIn && (
            <Link href="/account/history" className="flex items-center gap-2 hover:text-foreground">
              <History className="h-4 w-4" />
              History
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 hover:text-foreground">
              <Crown className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="relative flex items-center gap-3">
          <div className="hidden md:flex">
            <Button variant="ghost" className="gap-2" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen} aria-haspopup="menu">
              <User className="h-4 w-4" />
              {displayName}
              {displayRole && <span className="text-xs text-muted-foreground">{displayRole}</span>}
            </Button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-44 rounded-lg border border-border/50 bg-background/95 p-2 text-sm shadow-lg">
                {isSignedIn ? (
                  <>
                    <Link href="/account/history" className="block rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      Reading history
                    </Link>
                    <Link href="/account/bookmarks" className="block rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      Bookmarks
                    </Link>
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                      onClick={() => {
                        clearSession();
                        setProfileOpen(false);
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/sign-in" className="block rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      Login
                    </Link>
                    <Link href="/auth/register" className="block rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Button className="hidden bg-amber-200 text-zinc-950 hover:bg-amber-200/90 md:inline-flex" asChild>
            <Link href="/library">Start reading</Link>
          </Button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-border/40 bg-background/90 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="/updates" className="flex items-center gap-2 hover:text-foreground" onClick={() => setMenuOpen(false)}>
              <Flame className="h-4 w-4" />
              Updates
            </Link>
            <Link href="/library" className="flex items-center gap-2 hover:text-foreground" onClick={() => setMenuOpen(false)}>
              <BookOpenText className="h-4 w-4" />
              Series
            </Link>

            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 hover:text-foreground" onClick={() => setMenuOpen(false)}>
                <Crown className="h-4 w-4" />
                Admin
              </Link>
            )}
            {isSignedIn ? (
              <>
                <Link href="/account/history" className="flex items-center gap-2 hover:text-foreground" onClick={() => setMenuOpen(false)}>
                  <History className="h-4 w-4" />
                  History
                </Link>
                <Link href="/account/bookmarks" className="flex items-center gap-2 hover:text-foreground" onClick={() => setMenuOpen(false)}>
                  <Bookmark className="h-4 w-4" />
                  Bookmarks
                </Link>
                <Button className="justify-start bg-amber-200 text-zinc-950 hover:bg-amber-200/90" asChild onClick={() => setMenuOpen(false)}>
                  <Link href="/library">Start reading</Link>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    clearSession();
                    setMenuOpen(false);
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
                  <Link href="/auth/sign-in">Login</Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
                  <Link href="/auth/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
