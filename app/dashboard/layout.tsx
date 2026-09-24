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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Job Matcher
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">
            Matches
          </Link>
          <Link href="/dashboard/profile" className="text-sm text-gray-600 hover:text-black">
            Resume & keywords
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-sm text-gray-600 underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
