
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, Loader2 } from "lucide-react";
import { useState } from "react";


interface ImageUploaderProps {
  onImageSubmit: (dataUri: string) => void;
  isLoading: boolean;
  error?: string | null;
  loadingMessage?: string;
}

export function ImageUploader({ onImageSubmit, isLoading, error, loadingMessage="Analizando..." }: ImageUploaderProps) {
  const [currentImageDataUri, setCurrentImageDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          setCurrentImageDataUri(e.target.result);
          // Store it in the hidden input for page.tsx to potentially access for re-analysis
          const hiddenInput = document.getElementById('currentImageUsedForAnalysis') as HTMLInputElement | null;
          if (hiddenInput) {
            hiddenInput.value = e.target.result;
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentImageDataUri(null);
      setFileName(null);
      const hiddenInput = document.getElementById('currentImageUsedForAnalysis') as HTMLInputElement | null;
      if (hiddenInput) {
            hiddenInput.value = '';
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentImageDataUri) {
      onImageSubmit(currentImageDataUri);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <UploadCloud className="h-7 w-7 text-primary" />
          Subir Imagen para Análisis
        </CardTitle>
        <CardDescription>
          Selecciona una imagen con áreas marcadas en Córdoba para identificar barrios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="imageFile" className="text-base">Archivo de Imagen</Label>
            <Input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold"
            />
            {fileName && <p className="text-sm text-muted-foreground">Archivo seleccionado: {fileName}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading || !currentImageDataUri} className="w-full text-lg py-6">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              "Analizar Imagen"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
