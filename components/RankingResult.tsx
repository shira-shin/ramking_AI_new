import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type RankedCandidate = {
  candidate: string;
  score: number;
  reason?: string;
};

type RankingResultProps = {
  results: RankedCandidate[];
  loading?: boolean;
  error?: string | null;
};

export function RankingResult({ results, loading, error }: RankingResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          View the AI-generated ranking with scores and explanations for each candidate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Generating ranking...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : results.length > 0 ? (
          <Table>
            <TableCaption>Higher scores indicate stronger alignment with your criteria.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="w-[120px]">Score</TableHead>
                <TableHead>Reasoning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((item, index) => (
                <TableRow key={`${item.candidate}-${index}`} className="align-top">
                  <TableCell className="font-semibold">#{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.candidate}</TableCell>
                  <TableCell>{item.score.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.reason || "No explanation provided."}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            Submit candidates to see ranked results, including AI-generated reasoning for each entry.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
