
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
import { MapPin, CheckCircle2, AlertTriangle, XCircle, ListCollapse, Info } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card"; // Added for partial overlap image

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
            <p className="text-muted-foreground">No se encontraron barrios superpuestos en la imagen proporcionada.</p>
        </div>
    );
  }

  const totalOverlapCount = results.filter(r => r.overlapType === 'total').length;
  const partialOverlapCount = results.filter(r => r.overlapType === 'partial').length;
  const noOverlapCount = results.filter(r => r.overlapType === 'none').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 mt-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Resultados del Análisis</h2>
        <p className="text-muted-foreground mt-1">
          Mostrando {results.length} barrios. Superposición Total: {totalOverlapCount}, Parcial: {partialOverlapCount}, Ninguna: {noOverlapCount}.
        </p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nombre del Barrio</TableHead>
                <TableHead className="text-center">Tipo de Superposición</TableHead>
                <TableHead className="text-center">Porcentaje (%)</TableHead>
                <TableHead className="text-center">Imagen/Coordenadas</TableHead>
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
                    <TableCell className="text-center">
                      {barrio.overlapType === "partial" && barrio.overlapPercentage !== undefined
                        ? `${barrio.overlapPercentage.toFixed(2)}%`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {barrio.overlapType === "partial" && (
                        <div className="space-y-2">
                           <div className="my-1 rounded-md overflow-hidden border max-w-[200px] mx-auto">
                            <Image
                              src={`https://placehold.co/200x100/EBF5FB/5DADE2?text=${encodeURIComponent(barrio.barrioName + ' Overlay')}`}
                              alt={`Mapa placeholder para ${barrio.barrioName}`}
                              width={200}
                              height={100}
                              className="w-full h-auto object-cover"
                              data-ai-hint="map cordoba polygon"
                            />
                          </div>
                          {barrio.polygonCoordinates && barrio.polygonCoordinates.length > 0 && (
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value={`coords-${index}`} className="border-b-0">
                                <AccordionTrigger className="text-xs hover:no-underline py-1.5 px-2 rounded-md hover:bg-accent/50 justify-center">
                                  <div className="flex items-center gap-1">
                                    <ListCollapse className="h-3 w-3" />
                                    Ver Coordenadas
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="mt-1">
                                  <pre className="p-2 bg-muted/30 rounded-md text-[10px] leading-tight overflow-x-auto max-h-28">
                                    {JSON.stringify(barrio.polygonCoordinates, null, 2)}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      )}
                       {barrio.overlapType === "total" && (
                        <div className="my-1 rounded-md overflow-hidden border max-w-[200px] mx-auto">
                            <Image
                                src={`https://placehold.co/200x100/EBF5FB/5DADE2?text=${encodeURIComponent(barrio.barrioName)}`}
                                alt={`Mapa placeholder para ${barrio.barrioName}`}
                                width={200}
                                height={100}
                                className="w-full h-auto object-cover"
                                data-ai-hint="map cordoba"
                            />
                        </div>
                       )}
                      {barrio.overlapType === "none" && (
                        <p className="text-xs text-muted-foreground italic text-center">No aplicable</p>
                      )}
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
