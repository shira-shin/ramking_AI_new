import Link from "next/link";

import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const features = [
  {
    title: "AI-driven rankings",
    description: "Leverage OpenAI to synthesize complex criteria into clear, explainable results.",
  },
  {
    title: "Collaborative criteria",
    description: "Capture your team's priorities with JSON definitions or intuitive sliders.",
  },
  {
    title: "Secure access",
    description: "Sign in with Google to keep your rankings private and synced across sessions.",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-12 px-6 py-16 md:px-8">
      <section className="grid gap-10 md:grid-cols-[3fr,2fr] md:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Powered by Next.js 14 & OpenAI
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Rank your options with confidence.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Ranking AI helps teams and founders prioritize ideas, candidates, and initiatives. Define your evaluation criteria,
            submit contenders, and receive transparent AI-backed scoring in seconds.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AuthButton />
            {session?.user ? (
              <Button asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/dashboard">Explore the dashboard</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-primary/10 bg-card/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Make decision-making faster by capturing subjective and objective measures in a repeatable workflow.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
