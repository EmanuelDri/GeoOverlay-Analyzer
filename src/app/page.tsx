
"use client";

import { useState, useEffect } from "react";
import type { IdentifyBarriosOutput } from "@/types";
import { identifyBarriosFromImage } from "@/ai/flows/identify-barrios-from-image";
import { correlateBarriosWithPoints } from "@/ai/flows/correlate-barrios-points";
import { extractPointsFromPage } from "@/ai/flows/extract-points-from-page-flow";
import { ImageUploader } from "@/components/geo-analyzer/ImageUploader";
import { BarrioResultsTable } from "@/components/geo-analyzer/BarrioResultsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Terminal, Info, ListChecks, HelpCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_IMAGE_DATA_URI = "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE";
const DEFAULT_POINTS_URL = "https://www.cba.gov.ar/cba-segura/"; // Example URL, verify this

export default function GeoOverlayAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analizando imagen...");
  const [results, setResults] = useState<IdentifyBarriosOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [defaultAnalysisDone, setDefaultAnalysisDone] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"default" | "upload" | null>(null);
  const [puntosCbaSeguraJsonData, setPuntosCbaSeguraJsonData] = useState<string>("");
  const [isExtractingPoints, setIsExtractingPoints] = useState(false);
  const [currentImageUsedForAnalysis, setCurrentImageUsedForAnalysis] = useState<string | null>(null);

  const handleFullAnalysis = async (imageDataUri: string | null, puntosJson: string, source: "default" | "upload") => {
    if (!imageDataUri && source === "upload") {
       toast({ title: "Imagen Requerida", description: "Por favor, sube una imagen para analizar.", variant: "destructive" });
       setIsLoading(false);
       return;
    }
    
    setIsLoading(true);
    setError(null);
    // Don't clear results if only points are being updated for an existing image analysis
    if (source === "upload" && imageDataUri) {
        setResults(null); 
    }
    setAnalysisSource(source);

    let barriosIdentificados: IdentifyBarriosOutput = [];

    if (imageDataUri) {
        try {
            setLoadingMessage("Identificando barrios desde la imagen...");
            toast({ title: "Paso 1: Identificando Barrios", description: "Analizando la imagen..." });
            barriosIdentificados = await identifyBarriosFromImage({ imageUri: imageDataUri });
            setCurrentImageUsedForAnalysis(imageDataUri); // Store for potential re-correlation

            if (barriosIdentificados.length === 0 && source === "upload") {
                toast({
                title: "Análisis de Imagen Completo",
                description: "No se identificaron barrios a partir de la imagen proporcionada.",
                variant: "default",
                });
                setResults([]);
                // Continue to point correlation if pointsJson is present
            }
        } catch (e) {
            console.error("Error during image analysis:", e);
            const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante el análisis de imagen.";
            setError(errorMessage);
            setResults(null);
            toast({ title: "Falló el Análisis de Imagen", description: errorMessage, variant: "destructive" });
            setIsLoading(false);
            return;
        }
    } else if (results && results.length > 0) {
      // Re-correlating points with existing barrio results
      barriosIdentificados = results;
      toast({ title: "Actualizando Puntos", description: "Re-correlacionando con los barrios previamente identificados." });
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
        setResults(barriosIdentificados.length > 0 ? barriosIdentificados : (results || [])); // Show existing barrios if error in points
        setIsLoading(false);
        return;
      }

      if (barriosIdentificados.length > 0) {
        setLoadingMessage("Correlacionando barrios con puntos de interés...");
        toast({ title: "Paso 2: Correlacionando Puntos", description: "Analizando puntos de interés con los barrios identificados..." });
        
        try {
            const barriosConPuntos = await correlateBarriosWithPoints({
                identifiedBarriosJson: JSON.stringify(barriosIdentificados),
                puntosCbaSeguraJson: puntosJson,
            });
            setResults(barriosConPuntos);
            toast({
                title: "Análisis Completo",
                description: `Se procesaron ${barriosConPuntos.length} barrios y ${parsedPuntos.length} puntos de interés.`,
            });
        } catch (e) {
            console.error("Error during point correlation:", e);
            const corrErrorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante la correlación de puntos.";
            setError(corrErrorMessage);
            // Keep barriosIdentificados if correlation fails
            setResults(barriosIdentificados);
            toast({ title: "Falló la Correlación de Puntos", description: corrErrorMessage, variant: "destructive" });
        }

      } else {
        setResults([]); // No barrios to correlate with
        toast({
          title: "Análisis de Puntos Omitido",
          description: "No se identificaron barrios, por lo que los puntos de interés no pudieron ser correlacionados. Se mostrarán solo los puntos si la extracción fue exitosa.",
        });
         // If puntosJson was valid, perhaps show a message about the points themselves?
         // For now, if no barrios, results are empty.
      }
    } else {
      // No puntos JSON provided, just show barrios
      setResults(barriosIdentificados);
      if (imageDataUri) { // Only toast if it was an image analysis
          toast({
            title: "Análisis de Imagen Exitoso",
            description: `Se identificaron ${barriosIdentificados.length} barrios. No se procesaron puntos de interés.`,
          });
      }
    }

    setIsLoading(false);
    setLoadingMessage("Analizando imagen...");
  };
  
  useEffect(() => {
    const loadDefaultImageAndPoints = async () => {
      if (DEFAULT_IMAGE_DATA_URI !== "PASTE_YOUR_BASE64_IMAGE_DATA_URI_HERE" && DEFAULT_IMAGE_DATA_URI.startsWith("data:image") && !defaultAnalysisDone) {
        toast({
          title: "Cargando Datos por Defecto",
          description: "Analizando mapa por defecto y extrayendo puntos...",
        });
        setDefaultAnalysisDone(true); // Set early to prevent re-trigger
        
        let initialPointsJson = "";
        try {
          setIsExtractingPoints(true);
          setLoadingMessage("Extrayendo puntos de cbasegura.com.ar...");
          toast({ title: "Extrayendo Puntos", description: `Intentando extraer de ${DEFAULT_POINTS_URL}... esto puede tardar.`});
          const { extractedPointsJson } = await extractPointsFromPage({ targetUrl: DEFAULT_POINTS_URL });
          if (extractedPointsJson && extractedPointsJson !== "[]") {
            initialPointsJson = extractedPointsJson;
            setPuntosCbaSeguraJsonData(extractedPointsJson);
            const numPoints = JSON.parse(extractedPointsJson).length;
            toast({ title: "Extracción Exitosa", description: `Se extrajeron ${numPoints} puntos de interés.` });
          } else {
            toast({ title: "Extracción de Puntos Fallida", description: "No se pudieron extraer puntos automáticamente. Puedes intentar analizar sin ellos o verificar la URL de origen.", variant: "destructive" });
          }
        } catch(e) {
          const errorMsg = e instanceof Error ? e.message : "Error desconocido";
          toast({ title: "Error Extrayendo Puntos", description: errorMsg, variant: "destructive" });
          console.error("Error extrayendo puntos por defecto:", e);
        } finally {
          setIsExtractingPoints(false);
        }
        
        await handleFullAnalysis(DEFAULT_IMAGE_DATA_URI, initialPointsJson, "default");
      }
    };
    loadDefaultImageAndPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSubmitImage = (imageDataUri: string) => {
    setCurrentImageUsedForAnalysis(imageDataUri); // Store current image for re-analysis
    handleFullAnalysis(imageDataUri, puntosCbaSeguraJsonData, "upload");
  };

  const handleExtractAndCorrelatePoints = async () => {
    setIsExtractingPoints(true);
    setError(null);
    setLoadingMessage("Extrayendo puntos...");
    toast({ title: "Extrayendo Puntos de Interés", description: `Contactando ${DEFAULT_POINTS_URL}...` });

    try {
      const { extractedPointsJson } = await extractPointsFromPage({ targetUrl: DEFAULT_POINTS_URL });
      if (extractedPointsJson && extractedPointsJson !== "[]") {
        setPuntosCbaSeguraJsonData(extractedPointsJson);
        const numPoints = JSON.parse(extractedPointsJson).length;
        toast({ title: "Extracción Exitosa", description: `Se extrajeron ${numPoints} puntos. Correlacionando con barrios...` });
        
        // If results (barrios) already exist, re-correlate. Otherwise, user needs to upload image.
        if (results && results.length > 0 && currentImageUsedForAnalysis) {
           await handleFullAnalysis(currentImageUsedForAnalysis, extractedPointsJson, "upload");
        } else if (currentImageUsedForAnalysis) { // Image was analyzed but no barrios found, still try full analysis
           await handleFullAnalysis(currentImageUsedForAnalysis, extractedPointsJson, "upload");
        } else {
             toast({ title: "Puntos Extraídos", description: "Sube una imagen para correlacionar estos puntos con los barrios."});
        }

      } else {
        setPuntosCbaSeguraJsonData("[]"); // Set to empty array string
        toast({ title: "Extracción de Puntos Fallida", description: "No se pudieron extraer puntos. El sitio podría no ser accesible o no contener los datos esperados.", variant: "destructive" });
      }
    } catch (e) {
      console.error("Error during manual point extraction:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      toast({ title: "Error en Extracción", description: errorMessage, variant: "destructive" });
    } finally {
      setIsExtractingPoints(false);
      setLoadingMessage("Analizando imagen...");
    }
  };


  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          GeoOverlay Analyzer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-3xl mx-auto">
          Sube una imagen con regiones marcadas en Córdoba, Argentina. Los puntos de interés se intentarán extraer automáticamente de <a href={DEFAULT_POINTS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{DEFAULT_POINTS_URL}</a>.
        </p>
      </header>

      <div className="w-full max-w-xl space-y-8">
        <ImageUploader onImageSubmit={handleSubmitImage} isLoading={isLoading && analysisSource === 'upload'} error={analysisSource === 'upload' && error && !results ? error : null} loadingMessage={loadingMessage} />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-6 w-6 text-primary" />
              Puntos de Interés (<a href={DEFAULT_POINTS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-base">Fuente</a>)
            </CardTitle>
            <CardDescription>
              Intenta extraer automáticamente los puntos de interés. Este proceso es experimental y puede fallar o tomar tiempo.
              <a href="https://raw.githubusercontent.com/firebase/genkit/main/experimental/geo-analyzer-app/sample_cba_segura_points.json" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline ml-2 flex items-center gap-1">
                Ver formato JSON de ejemplo <HelpCircle size={14}/>
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExtractAndCorrelatePoints}
              disabled={isExtractingPoints || isLoading}
              className="w-full"
            >
              {isExtractingPoints ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Extrayendo Puntos...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-5 w-5" />
                  Extraer Puntos y (Re)Correlacionar
                </>
              )}
            </Button>
             <Alert variant="default" className="mt-3 text-xs">
                <Info className="h-4 w-4" />
                <AlertDescription>
                Presiona el botón para intentar la extracción. Si ya analizaste una imagen, los puntos extraídos se usarán para actualizar los resultados. Si no, se guardarán para cuando subas una imagen. La extracción puede fallar si el sitio de origen no es accesible o su estructura cambió.
                </AlertDescription>
            </Alert>
             {puntosCbaSeguraJsonData && puntosCbaSeguraJsonData !== "[]" && (
                <Alert variant="default" className="mt-3 text-xs border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                        Puntos de interés cargados ({JSON.parse(puntosCbaSeguraJsonData).length} puntos). Listos para ser correlacionados o ya correlacionados.
                    </AlertDescription>
                </Alert>
             )}
          </CardContent>
        </Card>
      </div>
      
      <input type="hidden" id="currentImageUsedForAnalysis" value={currentImageUsedForAnalysis || ""} />


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
      
      {!isLoading && !isExtractingPoints && !results && !error && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">Esperando la carga de la imagen o extracción de puntos para comenzar el análisis.</p>
          <p className="text-sm">Usa el formulario de arriba para seleccionar tu imagen y/o extraer puntos de interés.</p>
        </div>
      )}
    </main>
  );
}
