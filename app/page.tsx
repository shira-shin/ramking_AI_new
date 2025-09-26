import Link from "next/link";
import { Brain, MessageSquareText, UsersRound } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { cn } from "@/lib/utils";

const primaryCtaClasses = cn(
  "inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90"
);

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="space-y-4">
        <span className="rounded-full bg-black/5 px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
          Ranking AI workspace
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Compare candidates with AI-assisted scoring
        </h1>
        <p className="text-lg text-gray-600 sm:text-xl">
          Define the evaluation criteria, invite the AI to weigh each candidate, and share actionable reasoning with your team.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/dashboard" className={primaryCtaClasses}>
          Go to dashboard
        </Link>
        <AuthButton />
      </div>

      <div className="grid w-full gap-6 rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm sm:grid-cols-3">
        <div className="space-y-2">
          <Brain className="h-6 w-6 text-black" />
          <h2 className="text-lg font-semibold text-gray-900">Guided criteria</h2>
          <p className="text-sm text-gray-600">
            Start from proven templates like balanced, storytelling, or data-driven, then tweak the weights to match your review.
          </p>
        </div>
        <div className="space-y-2">
          <UsersRound className="h-6 w-6 text-black" />
          <h2 className="text-lg font-semibold text-gray-900">Collaborative inputs</h2>
          <p className="text-sm text-gray-600">
            Capture candidate details dynamically and keep everything in sync thanks to a shared state powered by Zustand.
          </p>
        </div>
        <div className="space-y-2">
          <MessageSquareText className="h-6 w-6 text-black" />
          <h2 className="text-lg font-semibold text-gray-900">Explainable rankings</h2>
          <p className="text-sm text-gray-600">
            Each AI generated score arrives with a reason so stakeholders understand the trade-offs behind the ordering.
          </p>
        </div>
      </div>
    </main>
  );
}
