import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">Malaz Translation</p>
          <p>Light novel translations with calm, fast reading.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/library" className="hover:text-foreground">
            Updates
          </Link>
          <Link href="/library" className="hover:text-foreground">
            Series
          </Link>
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
