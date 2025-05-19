
"use client";

import { useState, useEffect } from "react";
import type { IdentifyBarriosOutput } from "@/types";
import { identifyBarriosFromImage } from "@/ai/flows/identify-barrios-from-image";
import { ImageUploader } from "@/components/geo-analyzer/ImageUploader";
import { BarrioResultsTable } from "@/components/geo-analyzer/BarrioResultsTable"; // Changed from BarrioResultsDisplay
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TODO: Replace the placeholder below with the actual Base64 encoded Data URI of your default image.
// Example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//..."
const DEFAULT_IMAGE_DATA_URI = "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE";

export default function GeoOverlayAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<IdentifyBarriosOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [defaultAnalysisDone, setDefaultAnalysisDone] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"default" | "upload" | null>(null);


  const handleImageSubmit = async (dataUri: string, source: "default" | "upload") => {
    setIsLoading(true);
    setError(null);
    // Do not clear results if it's the default analysis and results are already present from a user upload
    if (source === "upload" || !results) {
      setResults(null);
    }
    setAnalysisSource(source);

    try {
      const analysisResults = await identifyBarriosFromImage({ imageUri: dataUri });
      setResults(analysisResults);
      if (analysisResults.length === 0) {
        toast({
          title: "Análisis Completo",
          description: "No se identificaron barrios a partir de la imagen proporcionada.",
          variant: "default",
        });
      } else {
         toast({
          title: "Análisis Exitoso",
          description: `Se identificaron ${analysisResults.length} barrios.`,
        });
      }
    } catch (e) {
      console.error("Error analyzing image:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante el análisis.";
      setError(errorMessage);
      setResults(null); // Clear results on error
      toast({
        title: "Falló el Análisis",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadDefaultImage = async () => {
      if (DEFAULT_IMAGE_DATA_URI !== "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE" && DEFAULT_IMAGE_DATA_URI.startsWith("data:image") && !defaultAnalysisDone) {
        toast({
          title: "Cargando Imagen por Defecto",
          description: "Analizando el mapa por defecto...",
        });
        await handleImageSubmit(DEFAULT_IMAGE_DATA_URI, "default");
        setDefaultAnalysisDone(true);
      }
    };

    loadDefaultImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          GeoOverlay Analyzer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-2xl mx-auto">
          Sube una imagen con regiones marcadas en Córdoba, Argentina. Identificaremos qué barrios se superponen con estas regiones.
        </p>
      </header>

      <ImageUploader onImageSubmit={(dataUri) => handleImageSubmit(dataUri, "upload")} isLoading={isLoading} error={analysisSource === 'upload' && error && !results ? error : null} />

      {DEFAULT_IMAGE_DATA_URI === "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE" && !defaultAnalysisDone && (
        <Alert variant="default" className="mt-8 w-full max-w-3xl bg-blue-50 border-blue-200">
           <Info className="h-4 w-4 text-blue-600" />
           <AlertTitle className="text-blue-700">Imagen por Defecto no Configurada</AlertTitle>
           <AlertDescription className="text-blue-600">
             Para cargar automáticamente un mapa al inicio, edita el archivo <code className="font-mono bg-blue-100 p-1 rounded text-sm">src/app/page.tsx</code> y reemplaza <code className="font-mono bg-blue-100 p-1 rounded text-sm">PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE</code> con la Data URI Base64 de tu imagen.
           </AlertDescription>
         </Alert>
      )}

      {error && (!results || results.length === 0) && ( 
         <Alert variant="destructive" className="mt-8 w-full max-w-3xl">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Ocurrió un Error Durante el Análisis</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {results && <BarrioResultsTable results={results} />}
      
      {!isLoading && !results && !error && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">Esperando la carga de la imagen para comenzar el análisis.</p>
          <p className="text-sm">Usa el formulario de arriba para seleccionar tu imagen.</p>
        </div>
      )}
    </main>
  );
}
