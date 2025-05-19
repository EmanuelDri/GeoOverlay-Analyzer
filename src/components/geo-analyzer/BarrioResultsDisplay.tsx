"use client";

import type { IdentifyBarriosOutput } from "@/types";
import { BarrioCard } from "./BarrioCard";
import { Separator } from "@/components/ui/separator";

interface BarrioResultsDisplayProps {
  results: IdentifyBarriosOutput;
}

export function BarrioResultsDisplay({ results }: BarrioResultsDisplayProps) {
  if (results.length === 0) {
    return <p className="text-center text-muted-foreground mt-8 text-lg">No barrio data to display.</p>;
  }

  const totalOverlapCount = results.filter(r => r.overlapType === 'total').length;
  const partialOverlapCount = results.filter(r => r.overlapType === 'partial').length;
  const noOverlapCount = results.filter(r => r.overlapType === 'none').length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 mt-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Analysis Results</h2>
        <p className="text-muted-foreground mt-1">
          Showing {results.length} barrios. Total Overlap: {totalOverlapCount}, Partial Overlap: {partialOverlapCount}, No Overlap: {noOverlapCount}.
        </p>
      </div>
      <Separator />
      <div className="space-y-6">
        {results.map((barrio, index) => (
          <BarrioCard key={index} barrio={barrio} />
        ))}
      </div>
    </div>
  );
}
