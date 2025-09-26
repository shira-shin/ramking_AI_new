"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { templates, useRankingStore } from "@/lib/store";

function parseJSON(value: string) {
  try {
    return { data: JSON.parse(value), error: null };
  } catch (error) {
    return { data: null, error: "Invalid JSON" } as const;
  }
}

export function RankingForm() {
  const {
    template,
    criteria,
    candidates,
    loading,
    error,
    setTemplate,
    setCriteria,
    updateCriterion,
    addCandidate,
    updateCandidate,
    removeCandidate,
    setLoading,
    setError,
    setResults,
    resetResults,
  } = useRankingStore();

  const [criteriaText, setCriteriaText] = useState(JSON.stringify(criteria, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setCriteriaText(JSON.stringify(criteria, null, 2));
  }, [criteria]);

  const canSubmit = useMemo(() => {
    const hasCandidates = candidates.filter((candidate) => candidate.trim().length > 0).length >= 2;
    return hasCandidates && !loading && !jsonError;
  }, [candidates, loading, jsonError]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    resetResults();

    const payload = {
      criteria,
      candidates: candidates.map((candidate) => candidate.trim()).filter(Boolean),
    };

    try {
      const response = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error ?? data?.message ?? "Ranking request failed");
      }

      setResults(data.results ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const key = event.target.value;
    const templateConfig = templates[key];
    if (!templateConfig) {
      setTemplate("custom", criteria);
      return;
    }
    setTemplate(key, templateConfig.criteria);
  }

  function handleCriteriaBlur() {
    const { data, error: parseError } = parseJSON(criteriaText);
    if (parseError || !data || typeof data !== "object") {
      setJsonError("Criteria must be valid JSON");
      return;
    }
    setJsonError(null);
    const normalised = Object.entries(data as Record<string, number>)
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value));
    if (!normalised.length) {
      setJsonError("Provide at least one numeric weight");
      return;
    }
    setCriteria(Object.fromEntries(normalised));
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardHeader>
          <CardTitle>Ranking criteria</CardTitle>
          <CardDescription>
            Choose a template or fine-tune weights. You can still edit the JSON directly if you need full control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <select
                id="template"
                value={template}
                onChange={handleTemplateChange}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {Object.entries(templates).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <p className="text-xs text-gray-500">
                {template === "custom" ? "Custom JSON weights." : templates[template]?.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Weight sliders</Label>
              <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-3">
                {Object.entries(criteria).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
                      <span>{key}</span>
                      <span>{value}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={value}
                      onChange={(event) => updateCriterion(key, Number(event.target.value))}
                      className="h-2 w-full cursor-pointer rounded-full bg-gray-200 accent-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteria">Criteria JSON</Label>
            <Textarea
              id="criteria"
              value={criteriaText}
              onChange={(event) => {
                setCriteriaText(event.target.value);
                const { error: parseError } = parseJSON(event.target.value);
                setJsonError(parseError);
              }}
              onBlur={handleCriteriaBlur}
            />
            <p className="text-xs text-gray-500">
              Provide numeric weights for each dimension. Higher numbers have more influence.
            </p>
            {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Candidates</CardTitle>
                <CardDescription>List at least two items to compare. Add more rows as needed.</CardDescription>
              </div>
              <Button type="button" variant="secondary" onClick={addCandidate}>
                Add candidate
              </Button>
            </div>
            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
                  <Input
                    value={candidate}
                    placeholder={`Candidate ${index + 1}`}
                    onChange={(event) => updateCandidate(index, event.target.value)}
                  />
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeCandidate(index)}
                      disabled={candidates.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t border-gray-100">
          <div className="text-xs text-gray-500">
            The OpenAI API ranks candidates using the criteria weights. Ensure API keys are configured before submitting.
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {loading ? "Ranking..." : "Run ranking"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
