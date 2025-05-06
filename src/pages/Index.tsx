
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import UrlForm from "@/components/UrlForm";
import JsonDiffViewer from "@/components/JsonDiffViewer";

const Index = () => {
  const [leftJson, setLeftJson] = useState<any>(null);
  const [rightJson, setRightJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [leftError, setLeftError] = useState<string | undefined>(undefined);
  const [rightError, setRightError] = useState<string | undefined>(undefined);

  const fetchData = async (url1: string, url2: string) => {
    setIsLoading(true);
    setLeftError(undefined);
    setRightError(undefined);
    
    try {
      // Fetch data from both URLs in parallel
      const [leftResponse, rightResponse] = await Promise.allSettled([
        fetchJson(url1),
        fetchJson(url2)
      ]);

      // Handle first URL response
      if (leftResponse.status === "fulfilled") {
        setLeftJson(leftResponse.value);
      } else {
        setLeftError(`Erreur: ${leftResponse.reason?.message || "Impossible de récupérer les données"}`);
        setLeftJson(null);
      }

      // Handle second URL response
      if (rightResponse.status === "fulfilled") {
        setRightJson(rightResponse.value);
      } else {
        setRightError(`Erreur: ${rightResponse.reason?.message || "Impossible de récupérer les données"}`);
        setRightJson(null);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to fetch and parse JSON from a URL
  const fetchJson = async (url: string) => {
    try {
      // Add http:// prefix if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Statut HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La réponse n'est pas au format JSON");
      }
      
      return await response.json();
    } catch (error: any) {
      // Re-throw to be handled by the caller
      throw error;
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">JSON Duel Visualizer</h1>
        <p className="text-muted-foreground">
          Comparez facilement les réponses de deux API REST
        </p>
      </header>
      
      <div className="mb-8">
        <UrlForm onFetchData={fetchData} isLoading={isLoading} />
      </div>
      
      {(leftJson || rightJson || leftError || rightError) && (
        <JsonDiffViewer
          leftJson={leftJson}
          rightJson={rightJson}
          leftError={leftError}
          rightError={rightError}
        />
      )}
    </div>
  );
};

export default Index;
