"use client";

import type { BarrioOverlapData } from "@/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, CheckCircle2, AlertTriangle, XCircle, ListCollapse } from "lucide-react";

interface BarrioCardProps {
  barrio: BarrioOverlapData;
}

export function BarrioCard({ barrio }: BarrioCardProps) {
  const getOverlapInfo = () => {
    switch (barrio.overlapType) {
      case "total":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          badgeVariant: "default" as "default", // Explicitly type for Badge variant
          badgeText: "Total Overlap",
          textColor: "text-green-700 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900",
        };
      case "partial":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          badgeVariant: "secondary" as "secondary",
          badgeText: "Partial Overlap",
          textColor: "text-yellow-700 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900",
        };
      case "none":
      default:
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          badgeVariant: "destructive" as "destructive",
          badgeText: "No Overlap",
          textColor: "text-red-700 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900",
        };
    }
  };

  const overlapInfo = getOverlapInfo();

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <MapPin className="h-6 w-6 text-primary" />
            {barrio.barrioName}
          </CardTitle>
          <Badge variant={overlapInfo.badgeVariant} className={`px-3 py-1 text-xs ${overlapInfo.bgColor} ${overlapInfo.textColor} border-none`}>
            {overlapInfo.icon}
            <span className="ml-1.5">{overlapInfo.badgeText}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {barrio.overlapType === "partial" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Overlap Percentage:{" "}
              <span className="font-bold text-accent-foreground">
                {barrio.overlapPercentage?.toFixed(2) ?? "N/A"}%
              </span>
            </p>
            
            <div className="my-2 rounded-md overflow-hidden border">
              <Image
                src={`https://placehold.co/600x300/EBF5FB/5DADE2?text=${encodeURIComponent(barrio.barrioName + ' Overlay')}`}
                alt={`Map placeholder for ${barrio.barrioName}`}
                width={600}
                height={300}
                className="w-full h-auto object-cover"
                data-ai-hint="map cordoba polygon"
              />
            </div>

            {barrio.polygonCoordinates && barrio.polygonCoordinates.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ListCollapse className="h-4 w-4" />
                      View Polygon Coordinates
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(barrio.polygonCoordinates, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
        {barrio.overlapType === "total" && (
           <div className="my-2 rounded-md overflow-hidden border">
              <Image
                src={`https://placehold.co/600x300/EBF5FB/5DADE2?text=${encodeURIComponent(barrio.barrioName + ' Full Area')}`}
                alt={`Map placeholder for ${barrio.barrioName}`}
                width={600}
                height={300}
                className="w-full h-auto object-cover"
                data-ai-hint="map cordoba"
              />
            </div>
        )}
        {barrio.overlapType === "none" && (
          <p className="text-sm text-muted-foreground italic">No significant overlap detected for this barrio.</p>
        )}
      </CardContent>
    </Card>
  );
}
