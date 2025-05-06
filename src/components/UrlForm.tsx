
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Clipboard, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UrlFormProps {
  onFetchData: (request1: ApiRequest, request2: ApiRequest) => void;
  isLoading: boolean;
  initialRequest1?: ApiRequest;
  initialRequest2?: ApiRequest;
}

export interface ApiRequest {
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body: string;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

const DEFAULT_HEADERS = [
  { name: "Authorization", value: "Bearer " },
  { name: "Content-Type", value: "application/json" },
  { name: "Accept", value: "application/json" },
  { name: "User-Agent", value: "JSON-Duel-Client" },
];

const UrlForm = ({ onFetchData, isLoading, initialRequest1, initialRequest2 }: UrlFormProps) => {
  const [request1, setRequest1] = useState<ApiRequest>({
    url: "",
    method: "GET",
    headers: [],
    body: "",
  });
  
  const [request2, setRequest2] = useState<ApiRequest>({
    url: "",
    method: "GET",
    headers: [],
    body: "",
  });
  
  // Initialize form with initial values if provided
  useEffect(() => {
    if (initialRequest1) {
      setRequest1(initialRequest1);
    }
    if (initialRequest2) {
      setRequest2(initialRequest2);
    }
  }, [initialRequest1, initialRequest2]);
  
  const [urlError1, setUrlError1] = useState<string>("");
  const [urlError2, setUrlError2] = useState<string>("");
  
  const [advancedMode1, setAdvancedMode1] = useState<boolean>(false);
  const [advancedMode2, setAdvancedMode2] = useState<boolean>(false);

  // Automatically open advanced mode if there are headers or body
  useEffect(() => {
    if ((initialRequest1?.headers && initialRequest1.headers.length > 0) || initialRequest1?.body) {
      setAdvancedMode1(true);
    }
    if ((initialRequest2?.headers && initialRequest2.headers.length > 0) || initialRequest2?.body) {
      setAdvancedMode2(true);
    }
  }, [initialRequest1, initialRequest2]);

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
    const isUrl1Valid = validateUrl(request1.url);
    const isUrl2Valid = validateUrl(request2.url);
    
    setUrlError1(isUrl1Valid ? "" : "L'URL n'est pas valide");
    setUrlError2(isUrl2Valid ? "" : "L'URL n'est pas valide");
    
    if (isUrl1Valid && isUrl2Valid) {
      // Format URLs if needed
      const req1 = {
        ...request1,
        url: request1.url.match(/^https?:\/\//) ? request1.url : `https://${request1.url}`,
      };
      
      const req2 = {
        ...request2,
        url: request2.url.match(/^https?:\/\//) ? request2.url : `https://${request2.url}`,
      };
      
      onFetchData(req1, req2);
    }
  };

  const handleRequestChange = (
    requestId: 1 | 2,
    field: keyof ApiRequest,
    value: string | { key: string; value: string }[]
  ) => {
    if (requestId === 1) {
      setRequest1({ ...request1, [field]: value });
      if (field === 'url') setUrlError1("");
    } else {
      setRequest2({ ...request2, [field]: value });
      if (field === 'url') setUrlError2("");
    }
  };

  const addHeader = (requestId: 1 | 2) => {
    const newHeader = { key: "", value: "" };
    if (requestId === 1) {
      setRequest1({
        ...request1,
        headers: [...request1.headers, newHeader],
      });
    } else {
      setRequest2({
        ...request2,
        headers: [...request2.headers, newHeader],
      });
    }
  };

  const updateHeader = (
    requestId: 1 | 2,
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    if (requestId === 1) {
      const updatedHeaders = [...request1.headers];
      updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
      setRequest1({ ...request1, headers: updatedHeaders });
    } else {
      const updatedHeaders = [...request2.headers];
      updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
      setRequest2({ ...request2, headers: updatedHeaders });
    }
  };

  const removeHeader = (requestId: 1 | 2, index: number) => {
    if (requestId === 1) {
      const updatedHeaders = request1.headers.filter((_, i) => i !== index);
      setRequest1({ ...request1, headers: updatedHeaders });
    } else {
      const updatedHeaders = request2.headers.filter((_, i) => i !== index);
      setRequest2({ ...request2, headers: updatedHeaders });
    }
  };

  const addPredefinedHeader = (requestId: 1 | 2, name: string, value: string) => {
    const newHeader = { key: name, value };
    if (requestId === 1) {
      // Vérifie si l'en-tête existe déjà
      const headerExists = request1.headers.some(h => h.key.toLowerCase() === name.toLowerCase());
      if (!headerExists) {
        setRequest1({
          ...request1,
          headers: [...request1.headers, newHeader],
        });
      }
    } else {
      const headerExists = request2.headers.some(h => h.key.toLowerCase() === name.toLowerCase());
      if (!headerExists) {
        setRequest2({
          ...request2,
          headers: [...request2.headers, newHeader],
        });
      }
    }
  };

  const pasteFromClipboard = async (requestId: 1 | 2, field: 'url' | 'body') => {
    try {
      const text = await navigator.clipboard.readText();
      handleRequestChange(requestId, field, text);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au presse-papier",
        variant: "destructive",
      });
    }
  };

  const useSampleRequests = () => {
    setRequest1({
      url: "jsonplaceholder.typicode.com/posts/1",
      method: "GET",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: "",
    });
    setRequest2({
      url: "jsonplaceholder.typicode.com/posts/2",
      method: "GET",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: "",
    });
    setUrlError1("");
    setUrlError2("");
  };

  const renderRequestConfig = (requestId: 1 | 2) => {
    const request = requestId === 1 ? request1 : request2;
    const urlError = requestId === 1 ? urlError1 : urlError2;
    const advancedMode = requestId === 1 ? advancedMode1 : advancedMode2;
    const setAdvancedMode = requestId === 1 ? setAdvancedMode1 : setAdvancedMode2;

    return (
      <div className="space-y-4">
        <div className="flex gap-3 items-start">
          <div className="w-24">
            <Select 
              value={request.method}
              onValueChange={(value) => handleRequestChange(requestId, "method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Méthode HTTP" />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Input
              value={request.url}
              onChange={(e) => handleRequestChange(requestId, "url", e.target.value)}
              placeholder="https://api.exemple.com/endpoint"
              className={`${urlError ? "border-red-500" : ""} pr-10`}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => pasteFromClipboard(requestId, 'url')}
            >
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">Coller</span>
            </Button>
            {urlError && <p className="text-red-500 text-sm">{urlError}</p>}
          </div>
        </div>
      
        <Collapsible
          open={advancedMode}
          onOpenChange={setAdvancedMode}
          className="border rounded-md p-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between p-2" size="sm">
              <span>Configuration avancée</span>
              {advancedMode ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            {/* En-têtes HTTP */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">En-têtes HTTP</h4>
              <div className="grid grid-cols-1 gap-2">
                {request.headers.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Nom"
                      value={header.key}
                      onChange={(e) =>
                        updateHeader(requestId, index, "key", e.target.value)
                      }
                      className="w-1/3"
                    />
                    <Input
                      placeholder="Valeur"
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(requestId, index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(requestId, index)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {DEFAULT_HEADERS.map((header) => (
                  <Button
                    key={header.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => addPredefinedHeader(requestId, header.name, header.value)}
                  >
                    + {header.name}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addHeader(requestId)}
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter en-tête
              </Button>
            </div>

            {/* Corps de la requête (body) */}
            {request.method !== "GET" && request.method !== "HEAD" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Corps de la requête</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => pasteFromClipboard(requestId, 'body')}
                  >
                    <Clipboard className="h-4 w-4 mr-1" /> Coller
                  </Button>
                </div>
                <Textarea
                  placeholder='{"exemple": "données JSON"}'
                  value={request.body}
                  onChange={(e) => handleRequestChange(requestId, "body", e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
                {request.body && !isValidJson(request.body) && (
                  <p className="text-red-500 text-sm">JSON invalide</p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const isValidJson = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="request1" className="text-sm font-medium">
            Première requête API
          </label>
          {renderRequestConfig(1)}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="request2" className="text-sm font-medium">
            Deuxième requête API
          </label>
          {renderRequestConfig(2)}
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
          onClick={useSampleRequests}
          disabled={isLoading}
        >
          Utiliser des exemples
        </Button>
      </div>
    </form>
  );
};

export default UrlForm;
