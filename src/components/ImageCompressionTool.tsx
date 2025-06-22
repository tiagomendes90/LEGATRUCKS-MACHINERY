
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompressTruckImages } from "@/hooks/useImageCompression";
import { Loader2, Image } from "lucide-react";

const ImageCompressionTool = () => {
  const compressMutation = useCompressTruckImages();

  const handleCompress = () => {
    if (confirm('Isto vai comprimir todas as imagens na base de dados. Continuar?')) {
      compressMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Compressão de Imagens
        </CardTitle>
        <CardDescription>
          Comprima todas as imagens dos veículos para melhorar a velocidade de carregamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCompress}
          disabled={compressMutation.isPending}
          className="w-full"
        >
          {compressMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comprimindo Imagens...
            </>
          ) : (
            'Comprimir Todas as Imagens'
          )}
        </Button>
        
        {compressMutation.isError && (
          <p className="text-sm text-red-600 mt-2">
            Erro: {compressMutation.error?.message}
          </p>
        )}
        
        {compressMutation.isSuccess && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Compressão concluída com sucesso!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageCompressionTool;
