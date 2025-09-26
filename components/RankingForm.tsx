"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { RankedCandidate } from "./RankingResult";

type RankingFormProps = {
  onRankingStart?: () => void;
  onRankingSuccess?: (results: RankedCandidate[]) => void;
  onRankingError?: (message: string) => void;
  onRankingComplete?: () => void;
};

type CriteriaMode = "json" | "sliders";

const defaultCriteriaJson = `{
  "impact": 0.4,
  "feasibility": 0.35,
  "effort": 0.25
}`;

const sliderOptions = [
  { id: "impact", label: "Impact", description: "How much positive change this candidate can create." },
  { id: "feasibility", label: "Feasibility", description: "How realistic it is to execute successfully." },
  { id: "effort", label: "Effort", description: "How much work is required (lower is better)." },
];

export function RankingForm({ onRankingStart, onRankingSuccess, onRankingError, onRankingComplete }: RankingFormProps) {
  const [criteriaMode, setCriteriaMode] = useState<CriteriaMode>("json");
  const [criteriaJson, setCriteriaJson] = useState(defaultCriteriaJson);
  const [weights, setWeights] = useState<Record<string, number>>({
    impact: 70,
    feasibility: 60,
    effort: 40,
  });
  const [candidates, setCandidates] = useState<string[]>(["Candidate A", "Candidate B", "Candidate C"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCandidateChange = (index: number, value: string) => {
    setCandidates((prev) => prev.map((candidate, i) => (i === index ? value : candidate)));
  };

  const handleAddCandidate = () => {
    setCandidates((prev) => [...prev, ""]);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWeightsChange = (id: string, value: number) => {
    setWeights((prev) => ({ ...prev, [id]: value }));
  };

  const parseCriteria = (): Record<string, unknown> => {
    if (criteriaMode === "json") {
      const parsed = JSON.parse(criteriaJson || "{}");
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Criteria JSON must be an object");
      }
      return parsed as Record<string, unknown>;
    }

    const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
    return Object.fromEntries(
      sliderOptions.map(({ id }) => [id, Number((weights[id] / total).toFixed(2))]),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    onRankingStart?.();
    setIsSubmitting(true);

    try {
      const criteria = parseCriteria();
      const payload = {
        criteria,
        candidates: candidates.map((candidate) => candidate.trim()).filter(Boolean),
      };

      if (payload.candidates.length === 0) {
        throw new Error("Please provide at least one candidate");
      }

      const response = await fetch("/api/rank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to rank candidates";
        throw new Error(message);
      }

      onRankingSuccess?.(data.results as RankedCandidate[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setLocalError(message);
      onRankingError?.(message);
    } finally {
      setIsSubmitting(false);
      onRankingComplete?.();
    }
  };

  return (
    <Card>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create a ranking</CardTitle>
          <CardDescription>
            Define how candidates should be evaluated and submit them for AI-powered scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={criteriaMode === "json" ? "default" : "outline"}
                onClick={() => setCriteriaMode("json")}
              >
                Criteria as JSON
              </Button>
              <Button
                type="button"
                variant={criteriaMode === "sliders" ? "default" : "outline"}
                onClick={() => setCriteriaMode("sliders")}
              >
                Criteria sliders
              </Button>
            </div>

            {criteriaMode === "json" ? (
              <div className="space-y-2">
                <Label htmlFor="criteria-json">Criteria (JSON)</Label>
                <Textarea
                  id="criteria-json"
                  value={criteriaJson}
                  onChange={(event) => setCriteriaJson(event.target.value)}
                  rows={8}
                  placeholder='{"impact": 0.5, "feasibility": 0.5}'
                />
                <p className="text-xs text-muted-foreground">
                  Provide weights or descriptors as JSON. Keys are used as criteria names.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
                {sliderOptions.map(({ id, label, description }) => (
                  <div key={id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`slider-${id}`}>{label}</Label>
                      <span className="text-sm text-muted-foreground">{weights[id]}%</span>
                    </div>
                    <input
                      id={`slider-${id}`}
                      type="range"
                      min={0}
                      max={100}
                      value={weights[id]}
                      onChange={(event) => handleWeightsChange(id, Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Candidates</Label>
            <div className="grid gap-3">
              {candidates.map((candidate, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={candidate}
                    placeholder={`Candidate ${index + 1}`}
                    onChange={(event) => handleCandidateChange(index, event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveCandidate(index)}
                    disabled={candidates.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={handleAddCandidate}>
              Add candidate
            </Button>
          </div>

          {localError && <p className="text-sm text-destructive">{localError}</p>}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
              {isSubmitting ? "Ranking..." : "Generate ranking"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
