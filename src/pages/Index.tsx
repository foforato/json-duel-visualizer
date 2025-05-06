
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import UrlForm from "@/components/UrlForm";
import JsonDiffViewer from "@/components/JsonDiffViewer";
import { ApiRequest } from "@/components/UrlForm";

const Index = () => {
  const [leftJson, setLeftJson] = useState<any>(null);
  const [rightJson, setRightJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [leftError, setLeftError] = useState<string | undefined>(undefined);
  const [rightError, setRightError] = useState<string | undefined>(undefined);
  const [leftStatus, setLeftStatus] = useState<number | undefined>(undefined);
  const [rightStatus, setRightStatus] = useState<number | undefined>(undefined);

  const fetchData = async (request1: ApiRequest, request2: ApiRequest) => {
    setIsLoading(true);
    setLeftError(undefined);
    setRightError(undefined);
    setLeftStatus(undefined);
    setRightStatus(undefined);
    
    try {
      // Fetch data from both URLs in parallel
      const [leftResponse, rightResponse] = await Promise.allSettled([
        fetchWithConfig(request1),
        fetchWithConfig(request2)
      ]);

      // Handle first URL response
      if (leftResponse.status === "fulfilled") {
        setLeftJson(leftResponse.value.data);
        setLeftStatus(leftResponse.value.status);
      } else {
        setLeftError(`Erreur: ${leftResponse.reason?.message || "Impossible de récupérer les données"}`);
        setLeftJson(null);
      }

      // Handle second URL response
      if (rightResponse.status === "fulfilled") {
        setRightJson(rightResponse.value.data);
        setRightStatus(rightResponse.value.status);
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

  // Helper function to fetch with full request configuration
  const fetchWithConfig = async (request: ApiRequest) => {
    try {
      // Prepare headers
      const headers: HeadersInit = {};
      request.headers.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });

      // Prepare request options
      const options: RequestInit = {
        method: request.method,
        headers,
      };

      // Add body for non-GET/HEAD requests
      if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
        try {
          // Try to parse as JSON first
          JSON.parse(request.body);
          options.body = request.body;
        } catch (e) {
          // If not valid JSON, send as plain text
          options.body = request.body;
        }
      }

      const response = await fetch(request.url, options);
      
      // Capture status code for display
      const status = response.status;
      
      if (!response.ok) {
        throw new Error(`Statut HTTP ${status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Try to parse it anyway, but inform the user
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return { data, status, warning: "La réponse n'indique pas un contenu JSON, mais a pu être analysée comme tel" };
        } catch {
          throw new Error("La réponse n'est pas au format JSON");
        }
      }
      
      const data = await response.json();
      return { data, status };
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
          leftStatus={leftStatus}
          rightStatus={rightStatus}
        />
      )}
    </div>
  );
};

export default Index;
