import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefuelForm } from "./refuel-form";
import { RecentEntries } from "./recent-entries";
import { readDashboard } from "./lib/sheet";

export const dynamic = "force-dynamic";

export default async function TankenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dashboard;
  let error: string | null = null;

  try {
    dashboard = await readDashboard();
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load data from sheet";
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold">Tanken</h1>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-6">
        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check that GOOGLE_SERVICE_ACCOUNT_JSON and
                GOOGLE_SHEETS_TANKEN_ID are set correctly.
              </p>
            </CardContent>
          </Card>
        ) : dashboard ? (
          <>
            {/* Dashboard cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-medium">
                    Verbrauch (gesamt)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">
                    {dashboard.verbrauchAllTime != null
                      ? `${dashboard.verbrauchAllTime.toFixed(1)}`
                      : "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">L / 100 km</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-medium">
                    Verbrauch (100 Tage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">
                    {dashboard.verbrauchLast100Days != null
                      ? `${dashboard.verbrauchLast100Days.toFixed(1)}`
                      : "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">L / 100 km</p>
                </CardContent>
              </Card>
            </div>

            {/* Last refuel info */}
            {dashboard.recentEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-medium">
                    Letzte Tankung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">
                      {dashboard.recentEntries[0].datum} &middot;{" "}
                      {dashboard.recentEntries[0].ort}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {dashboard.recentEntries[0].km.toLocaleString("de-DE")}{" "}
                      km
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Entry form */}
            <div>
              <h2 className="text-sm font-semibold mb-3">Neuer Tankvorgang</h2>
              <RefuelForm defaultOrt={dashboard.lastOrt} />
            </div>

            <Separator />

            {/* Recent entries */}
            <div>
              <h2 className="text-sm font-semibold mb-3">Letzte Tankungen</h2>
              <RecentEntries entries={dashboard.recentEntries} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
