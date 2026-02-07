"use client";

import { useAuthSession } from "@/lib/use-auth-session";

import { BloggerDashboard } from "@/components/blogger-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteNav } from "@/components/site/site-nav";

export default function AdminPage() {
  const session = useAuthSession();
  const isAdmin = session?.user.role === "admin";

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Loading session...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <p>Please log in with an admin account to view the dashboard.</p>
              <Button asChild className="bg-amber-200 text-zinc-950 hover:bg-amber-200/90">
                <a href="/auth/sign-in">Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <BloggerDashboard />;
}
