import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("keywords, remote_only, resume_path")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resume &amp; keywords</h1>
        <p className="mt-1 text-sm text-muted">
          We use these to find and score job postings for you every day.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <ProfileForm
          initialKeywords={profile?.keywords ?? []}
          initialRemoteOnly={profile?.remote_only ?? false}
          hasResume={Boolean(profile?.resume_path)}
        />
      </div>
    </div>
  );
}
