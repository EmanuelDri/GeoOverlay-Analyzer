"use client";

import { useState } from "react";
import type { IdentifyBarriosOutput } from "@/types";
import { identifyBarriosFromImage } from "@/ai/flows/identify-barrios-from-image";
import { ImageUploader } from "@/components/geo-analyzer/ImageUploader";
import { BarrioResultsDisplay } from "@/components/geo-analyzer/BarrioResultsDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GeoOverlayAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<IdentifyBarriosOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageSubmit = async (dataUri: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const analysisResults = await identifyBarriosFromImage({ imageUri: dataUri });
      setResults(analysisResults);
      if (analysisResults.length === 0) {
        toast({
          title: "Analysis Complete",
          description: "No barrios were identified from the provided image.",
          variant: "default",
        });
      } else {
         toast({
          title: "Analysis Successful",
          description: `Identified ${analysisResults.length} barrios.`,
        });
      }
    } catch (e) {
      console.error("Error analyzing image:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          GeoOverlay Analyzer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload an image with marked regions in Córdoba, Argentina. We&apos;ll identify which barrios overlap with these regions.
        </p>
      </header>

      <ImageUploader onImageSubmit={handleImageSubmit} isLoading={isLoading} error={error && !results ? error : null} />

      {error && results && ( // Show persistent error if analysis ran but had issues alongside results
         <Alert variant="destructive" className="mt-8 w-full max-w-3xl">
           <Terminal className="h-4 w-4" />
           <AlertTitle>An Error Occurred During Analysis</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {results && <BarrioResultsDisplay results={results} />}
      
      {!isLoading && !results && !error && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">Waiting for image upload to begin analysis.</p>
          <p className="text-sm">Use the form above to select your image.</p>
        </div>
      )}
    </main>
  );
}
