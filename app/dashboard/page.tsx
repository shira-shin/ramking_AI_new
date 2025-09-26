import { redirect } from "next/navigation";

import { RankingDashboard } from "@/app/dashboard/ranking-dashboard";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col gap-8 px-6 py-12 md:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Ranking workspace</h1>
        <p className="text-muted-foreground">
          Configure your evaluation and let the AI produce a ranked shortlist tailored to your goals.
        </p>
      </div>
      <RankingDashboard />
    </main>
  );
}
