import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="mr-4 text-sm font-semibold tracking-tight">
              Job Matcher
            </Link>
            <NavLink href="/dashboard">Matches</NavLink>
            <NavLink href="/dashboard/profile">Resume &amp; keywords</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div
              title={user?.email ?? undefined}
              className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-soft-foreground"
            >
              {initial}
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
    >
      {children}
    </Link>
  );
}
