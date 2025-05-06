
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Clipboard } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface UrlFormProps {
  onFetchData: (url1: string, url2: string) => void;
  isLoading: boolean;
}

const UrlForm = ({ onFetchData, isLoading }: UrlFormProps) => {
  const [url1, setUrl1] = useState<string>("");
  const [url2, setUrl2] = useState<string>("");
  const [urlError1, setUrlError1] = useState<string>("");
  const [urlError2, setUrlError2] = useState<string>("");

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      return false;
    }

    try {
      // Ajoute automatiquement https:// si aucun protocole n'est spécifié
      const urlToCheck = url.match(/^https?:\/\//) ? url : `https://${url}`;
      new URL(urlToCheck);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider les URL
    const isUrl1Valid = validateUrl(url1);
    const isUrl2Valid = validateUrl(url2);
    
    setUrlError1(isUrl1Valid ? "" : "L'URL n'est pas valide");
    setUrlError2(isUrl2Valid ? "" : "L'URL n'est pas valide");
    
    if (isUrl1Valid && isUrl2Valid) {
      // Ajouter https:// si nécessaire
      const formattedUrl1 = url1.match(/^https?:\/\//) ? url1 : `https://${url1}`;
      const formattedUrl2 = url2.match(/^https?:\/\//) ? url2 : `https://${url2}`;
      
      onFetchData(formattedUrl1, formattedUrl2);
    }
  };

  const pasteFromClipboard = async (setUrl: (url: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au presse-papier",
        variant: "destructive",
      });
    }
  };

  const useSampleUrls = () => {
    setUrl1("jsonplaceholder.typicode.com/posts/1");
    setUrl2("jsonplaceholder.typicode.com/posts/2");
    setUrlError1("");
    setUrlError2("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="url1" className="text-sm font-medium">
            Premier URL API
          </label>
          <div className="relative">
            <Input
              id="url1"
              value={url1}
              onChange={(e) => {
                setUrl1(e.target.value);
                if (urlError1) setUrlError1("");
              }}
              placeholder="https://api.exemple.com/v1/endpoint"
              className={urlError1 ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => pasteFromClipboard(setUrl1)}
            >
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">Coller</span>
            </Button>
          </div>
          {urlError1 && <p className="text-red-500 text-sm">{urlError1}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="url2" className="text-sm font-medium">
            Deuxième URL API
          </label>
          <div className="relative">
            <Input
              id="url2"
              value={url2}
              onChange={(e) => {
                setUrl2(e.target.value);
                if (urlError2) setUrlError2("");
              }}
              placeholder="https://api.exemple.com/v2/endpoint"
              className={urlError2 ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => pasteFromClipboard(setUrl2)}
            >
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">Coller</span>
            </Button>
          </div>
          {urlError2 && <p className="text-red-500 text-sm">{urlError2}</p>}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="flex items-center gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Comparer
            </>
          )}
        </Button>
        
        <Button 
          type="button" 
          variant="outline"
          onClick={useSampleUrls}
          disabled={isLoading}
        >
          Utiliser des exemples
        </Button>
      </div>
    </form>
  );
};

export default UrlForm;
