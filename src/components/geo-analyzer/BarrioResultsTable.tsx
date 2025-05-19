
"use client";

import type { IdentifyBarriosOutput, BarrioOverlapData } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, CheckCircle2, AlertTriangle, XCircle, ListCollapse, Info, Compass, Tag } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const getOverlapInfo = (barrio: BarrioOverlapData) => {
  switch (barrio.overlapType) {
    case "total":
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        badgeVariant: "default" as "default",
        badgeText: "Total",
        textColor: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900",
      };
    case "partial":
      return {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        badgeVariant: "secondary" as "secondary",
        badgeText: "Parcial",
        textColor: "text-yellow-700 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900",
      };
    case "none":
    default:
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        badgeVariant: "destructive" as "destructive",
        badgeText: "Ninguna",
        textColor: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900",
      };
  }
};

interface BarrioResultsTableProps {
  results: IdentifyBarriosOutput;
}

export function BarrioResultsTable({ results }: BarrioResultsTableProps) {
  if (results.length === 0) {
    return (
        <div className="mt-8 w-full max-w-3xl mx-auto text-center p-6 bg-card rounded-lg shadow">
            <Info className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Análisis Completado</h3>
            <p className="text-muted-foreground">No se encontraron barrios que coincidan con los criterios en la imagen proporcionada.</p>
        </div>
    );
  }

  const totalIdentified = results.length;
  // Recalculate counts based on current results
  const totalOverlapCount = results.filter(r => r.overlapType === 'total').length;
  const partialOverlapCount = results.filter(r => r.overlapType === 'partial').length;
  const noOverlapCount = results.filter(r => r.overlapType === 'none' || !r.overlapType).length;


  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 mt-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Resultados del Análisis</h2>
        <p className="text-muted-foreground mt-1">
          Total de barrios identificados: {totalIdentified}. Superposición con área marcada: Total: {totalOverlapCount}, Parcial: {partialOverlapCount}, Ninguna/No aplica: {noOverlapCount}.
        </p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] min-w-[180px]">Nombre del Barrio</TableHead>
                <TableHead className="text-center w-[150px]">Superposición (Imagen)</TableHead>
                <TableHead className="text-center w-[100px]">Porcentaje (%)</TableHead>
                <TableHead className="text-center w-[150px]">Coordenadas Barrio</TableHead>
                <TableHead className="text-center w-[120px]">Puntos Seguros (Total)</TableHead>
                <TableHead className="w-[200px] min-w-[180px]">Puntos Seguros (Categorías)</TableHead>
                 <TableHead className="text-center w-[150px]">Imagen Barrio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((barrio, index) => {
                const overlapInfo = getOverlapInfo(barrio);
                return (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        {barrio.barrioName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={overlapInfo.badgeVariant} className={`px-2.5 py-1 text-xs ${overlapInfo.bgColor} ${overlapInfo.textColor} border-none`}>
                        {overlapInfo.icon}
                        <span className="ml-1.5">{overlapInfo.badgeText}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {barrio.overlapType === "partial" && barrio.overlapPercentage !== undefined
                        ? `${barrio.overlapPercentage.toFixed(2)}%`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {barrio.barrioPolygonCoordinates && barrio.barrioPolygonCoordinates.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value={`coords-barrio-${index}`} className="border-b-0">
                            <AccordionTrigger className="text-xs hover:no-underline py-1.5 px-2 rounded-md hover:bg-accent/50 justify-center">
                              <div className="flex items-center gap-1">
                                <Compass className="h-3 w-3" />
                                Ver Coordenadas
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="mt-1">
                              <pre className="p-2 bg-muted/30 rounded-md text-[10px] leading-tight overflow-x-auto max-h-28">
                                {JSON.stringify(barrio.barrioPolygonCoordinates, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center">No disponibles</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                        {barrio.puntosCbaSegura ? barrio.puntosCbaSegura.totalPuntos : "N/A"}
                    </TableCell>
                    <TableCell>
                        {barrio.puntosCbaSegura && Object.keys(barrio.puntosCbaSegura.categoriasPuntos).length > 0 ? (
                           <ul className="text-xs space-y-0.5">
                            {Object.entries(barrio.puntosCbaSegura.categoriasPuntos).map(([cat, count]) =>(
                                <li key={cat} className="flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Tag size={12} className="text-muted-foreground"/> {cat}:</span>
                                    <Badge variant="outline" className="text-xs">{count}</Badge>
                                </li>
                            ))}
                           </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground italic text-center">
                                {barrio.puntosCbaSegura && barrio.puntosCbaSegura.totalPuntos === 0 ? "0 puntos" : "N/A"}
                            </p>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="my-1 rounded-md overflow-hidden border max-w-[120px] mx-auto">
                            <Image
                                src={`https://placehold.co/120x80/EBF5FB/5DADE2?text=${encodeURIComponent(barrio.barrioName)}`}
                                alt={`Mapa placeholder para ${barrio.barrioName}`}
                                width={120}
                                height={80}
                                className="w-full h-auto object-cover"
                                data-ai-hint="map cordoba"
                            />
                        </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
