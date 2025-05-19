
"use client";

import { useState, useEffect } from "react";
import type { IdentifyBarriosOutput } from "@/types";
import { identifyBarriosFromImage } from "@/ai/flows/identify-barrios-from-image";
import { correlateBarriosWithPoints } from "@/ai/flows/correlate-barrios-points";
import { ImageUploader } from "@/components/geo-analyzer/ImageUploader";
import { BarrioResultsTable } from "@/components/geo-analyzer/BarrioResultsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Terminal, Info, ListChecks, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


// TODO: Replace the placeholder below with the actual Base64 encoded Data URI of your default image.
// Example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//..."
const DEFAULT_IMAGE_DATA_URI = "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE";

export default function GeoOverlayAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analizando imagen...");
  const [results, setResults] = useState<IdentifyBarriosOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [defaultAnalysisDone, setDefaultAnalysisDone] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"default" | "upload" | null>(null);
  const [puntosCbaSeguraJsonData, setPuntosCbaSeguraJsonData] = useState<string>("");

  const handleFullAnalysis = async (imageDataUri: string, puntosJson: string, source: "default" | "upload") => {
    setIsLoading(true);
    setError(null);
    setResults(null); // Clear previous results
    setAnalysisSource(source);

    try {
      setLoadingMessage("Identificando barrios desde la imagen...");
      toast({ title: "Paso 1: Identificando Barrios", description: "Analizando la imagen..." });
      let barriosIdentificados = await identifyBarriosFromImage({ imageUri: imageDataUri });

      if (barriosIdentificados.length === 0 && source === "upload") {
        toast({
          title: "Análisis de Imagen Completo",
          description: "No se identificaron barrios a partir de la imagen proporcionada.",
          variant: "default",
        });
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      if (puntosJson.trim() !== "") {
        let parsedPuntos;
        try {
          parsedPuntos = JSON.parse(puntosJson);
          if (!Array.isArray(parsedPuntos)) throw new Error("El JSON de puntos debe ser un array.");
        } catch (e) {
          const parseError = e instanceof Error ? e.message : "Error desconocido al parsear JSON de puntos.";
          setError(`Error en el JSON de puntos: ${parseError}. Por favor, verifica el formato.`);
          toast({ title: "Error en JSON de Puntos", description: parseError, variant: "destructive" });
          // Still show barrios anaylsis results if available
          setResults(barriosIdentificados.length > 0 ? barriosIdentificados : null);
          setIsLoading(false);
          return;
        }

        if (barriosIdentificados.length > 0) {
          setLoadingMessage("Correlacionando barrios con puntos de interés...");
          toast({ title: "Paso 2: Correlacionando Puntos", description: "Analizando puntos de interés con los barrios identificados..." });
          
          const barriosConPuntos = await correlateBarriosWithPoints({
            identifiedBarriosJson: JSON.stringify(barriosIdentificados),
            puntosCbaSeguraJson: puntosJson,
          });
          setResults(barriosConPuntos);
          toast({
            title: "Análisis Completo",
            description: `Se identificaron ${barriosConPuntos.length} barrios y se procesaron los puntos de interés.`,
          });
        } else {
          // No barrios identified, but puntos JSON was provided.
          // Show no barrios, and perhaps a message that puntos couldn't be correlated.
          setResults([]);
           toast({
            title: "Análisis Completo",
            description: "No se identificaron barrios en la imagen, por lo que los puntos de interés no pudieron ser correlacionados.",
          });
        }
      } else {
        // No puntos JSON provided, just show barrios
        setResults(barriosIdentificados);
        toast({
          title: "Análisis de Imagen Exitoso",
          description: `Se identificaron ${barriosIdentificados.length} barrios. No se proporcionaron puntos de interés.`,
        });
      }

    } catch (e) {
      console.error("Error during analysis:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante el análisis.";
      setError(errorMessage);
      setResults(null);
      toast({
        title: "Falló el Análisis",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("Analizando imagen..."); // Reset loading message
    }
  };

  useEffect(() => {
    const loadDefaultImage = async () => {
      if (DEFAULT_IMAGE_DATA_URI !== "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE" && DEFAULT_IMAGE_DATA_URI.startsWith("data:image") && !defaultAnalysisDone) {
        toast({
          title: "Cargando Imagen por Defecto",
          description: "Analizando el mapa por defecto...",
        });
        // For default image, we assume no puntosCbaSeguraJsonData initially. User can add later.
        await handleFullAnalysis(DEFAULT_IMAGE_DATA_URI, "", "default");
        setDefaultAnalysisDone(true);
      }
    };
    loadDefaultImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const handleSubmitImageAndPoints = (imageDataUri: string) => {
    handleFullAnalysis(imageDataUri, puntosCbaSeguraJsonData, "upload");
  };


  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          GeoOverlay Analyzer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-3xl mx-auto">
          Sube una imagen con regiones marcadas en Córdoba, Argentina. Opcionalmente, proporciona un JSON con puntos de interés (ej. de cbasegura.com.ar) para correlacionarlos con los barrios identificados.
        </p>
      </header>

      <div className="w-full max-w-xl space-y-8">
        <ImageUploader onImageSubmit={handleSubmitImageAndPoints} isLoading={isLoading} error={analysisSource === 'upload' && error && !results ? error : null} loadingMessage={loadingMessage} />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-6 w-6 text-primary" />
              Puntos de Interés (Opcional)
            </CardTitle>
            <CardDescription>
              Pega aquí un array JSON de puntos de interés. Cada punto debe tener `lat`, `lng`, y `categoria`.
              <a href="https://raw.githubusercontent.com/firebase/genkit/main/experimental/geo-analyzer-app/sample_cba_segura_points.json" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline ml-2 flex items-center gap-1">
                Ver JSON de ejemplo <HelpCircle size={14}/>
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="puntosJson" className="sr-only">JSON de Puntos de Interés</Label>
            <Textarea
              id="puntosJson"
              placeholder='Ej: [{"lat": -31.41, "lng": -64.18, "categoria": "Comisaría"}, ...]'
              value={puntosCbaSeguraJsonData}
              onChange={(e) => setPuntosCbaSeguraJsonData(e.target.value)}
              className="min-h-[100px] text-xs"
              disabled={isLoading}
            />
            <Button 
              onClick={() => resultados && resultados.length > 0 ? handleFullAnalysis( (document.getElementById('currentImageUsedForAnalysis') as HTMLInputElement)?.value || '', puntosCbaSeguraJsonData, "upload") : toast({title: "Sube una imagen primero", description: "Debes analizar una imagen antes de (re)procesar con puntos de interés.", variant: "destructive"})}
              disabled={isLoading || !results}
              className="mt-4 w-full"
              variant="outline"
            >
              {isLoading ? "Procesando..." : "Re-analizar con estos Puntos (si ya hay imagen analizada)"}
            </Button>
             <Alert variant="default" className="mt-3 text-xs">
                <Info className="h-4 w-4" />
                <AlertDescription>
                Si ya analizaste una imagen, puedes pegar el JSON y presionar "Re-analizar" para añadir la información de puntos. Si subes una nueva imagen, los puntos aquí pegados se usarán automáticamente.
                La extracción de datos de cbasegura.com.ar debe hacerse manualmente.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      
      {/* Hidden input to store current image data uri if needed for re-analysis */}
      <input type="hidden" id="currentImageUsedForAnalysis" />


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
          <p className="text-sm">Usa el formulario de arriba para seleccionar tu imagen y opcionalmente pega el JSON de puntos de interés.</p>
        </div>
      )}
    </main>
  );
}
