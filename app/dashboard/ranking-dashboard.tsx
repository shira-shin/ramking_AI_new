"use client";

import { useState } from "react";

import { RankingForm } from "@/components/RankingForm";
import { RankingResult, type RankedCandidate } from "@/components/RankingResult";

export function RankingDashboard() {
  const [results, setResults] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
      <RankingForm
        onRankingStart={() => {
          setLoading(true);
          setError(null);
          setResults([]);
        }}
        onRankingSuccess={(payload) => {
          setResults(payload);
          setError(null);
        }}
        onRankingError={(message) => setError(message)}
        onRankingComplete={() => setLoading(false)}
      />
      <RankingResult results={results} loading={loading} error={error} />
    </div>
  );
}
