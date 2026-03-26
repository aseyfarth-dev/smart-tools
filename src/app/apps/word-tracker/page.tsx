import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AddWordForm } from "./add-word-form";
import { WordList } from "./word-list";
import type { Word } from "@/types/word-tracker";

export const dynamic = "force-dynamic";

export default async function WordTrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: words } = await supabase
    .from("words")
    .select("id, word, word_normalized, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold">Word Tracker</h1>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-6">
        <AddWordForm />
        <WordList words={(words as Word[]) ?? []} />
      </main>
    </div>
  );
}
