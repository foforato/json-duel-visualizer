import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import UrlForm from "@/components/UrlForm";
import JsonDiffViewer from "@/components/JsonDiffViewer";
import { ApiRequest } from "@/components/UrlForm";
import RequestHistory from "@/components/RequestHistory";
import { SavedRequest, useRequestStore } from "@/store/requestStore";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  // Fix: Initialize state before using store
  const [storeReady, setStoreReady] = useState(false);
  const [leftJson, setLeftJson] = useState<any>(null);
  const [rightJson, setRightJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [leftError, setLeftError] = useState<string | undefined>(undefined);
  const [rightError, setRightError] = useState<string | undefined>(undefined);
  const [leftStatus, setLeftStatus] = useState<number | undefined>(undefined);
  const [rightStatus, setRightStatus] = useState<number | undefined>(undefined);
  const [compareMode, setCompareMode] = useState<"url" | "direct">("url");
  
  // Fix: Use store only after hydration
  useEffect(() => {
    setStoreReady(true);
  }, []);
  
  // Fix: Conditional store access
  const { addRequest } = storeReady ? useRequestStore() : { addRequest: () => {} };
  const isMobile = useIsMobile();

  // Form pour la comparaison directe de JSON
  const form = useForm({
    defaultValues: {
      leftJsonText: "",
      rightJsonText: "",
    },
  });

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

      // Save request to history if both fetches are successful
      if (leftResponse.status === "fulfilled" && rightResponse.status === "fulfilled") {
        addRequest({
          name: `${request1.url.substring(0, 20)}... vs ${request2.url.substring(0, 20)}...`,
          request1,
          request2,
          response1: leftResponse.status === "fulfilled" ? leftResponse.value.data : null,
          response2: rightResponse.status === "fulfilled" ? rightResponse.value.data : null,
          leftStatus: leftResponse.status === "fulfilled" ? leftResponse.value.status : undefined,
          rightStatus: rightResponse.status === "fulfilled" ? rightResponse.value.status : undefined,
        });
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

  const compareDirectJson = () => {
    const values = form.getValues();
    setLeftError(undefined);
    setRightError(undefined);
    
    try {
      const leftData = JSON.parse(values.leftJsonText || "null");
      setLeftJson(leftData);
    } catch (e) {
      setLeftError("JSON invalide dans le premier champ");
      setLeftJson(null);
    }
    
    try {
      const rightData = JSON.parse(values.rightJsonText || "null");
      setRightJson(rightData);
    } catch (e) {
      setRightError("JSON invalide dans le second champ");
      setRightJson(null);
    }
  };

  const handleSelectSavedRequest = (request: SavedRequest) => {
    if (compareMode === "direct") {
      setCompareMode("url");
    }
    
    setLeftJson(request.response1 || null);
    setRightJson(request.response2 || null);
    setLeftStatus(request.leftStatus);
    setRightStatus(request.rightStatus);
    setLeftError(undefined);
    setRightError(undefined);
  };

  if (!storeReady) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <RequestHistory onSelectRequest={handleSelectSavedRequest} />
        
        <div className="flex-1 container py-8 max-w-7xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">JSON Duel Visualizer</h1>
            <p className="text-muted-foreground">
              Comparez facilement les réponses de deux API REST ou des JSON bruts
            </p>
          </header>
          
          <div className="mb-8">
            <Tabs 
              value={compareMode} 
              onValueChange={(value) => setCompareMode(value as "url" | "direct")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4 w-full md:w-[400px] mx-auto">
                <TabsTrigger value="url">APIs (URLs)</TabsTrigger>
                <TabsTrigger value="direct">JSON Direct</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url">
                <UrlForm onFetchData={fetchData} isLoading={isLoading} />
              </TabsContent>
              
              <TabsContent value="direct">
                {isMobile ? (
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button className="w-full mb-4">Éditer les JSON</Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[80vh] p-4">
                      <Form {...form}>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="leftJsonText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Premier JSON</FormLabel>
                                <Textarea
                                  placeholder='{"example": "value"}'
                                  className="min-h-[200px] font-mono"
                                  {...field}
                                />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="rightJsonText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Deuxième JSON</FormLabel>
                                <Textarea
                                  placeholder='{"example": "modified value"}'
                                  className="min-h-[200px] font-mono"
                                  {...field}
                                />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-between">
                            <Button 
                              onClick={compareDirectJson}
                              disabled={isLoading}
                              type="button"
                            >
                              Comparer
                            </Button>
                            <DrawerClose asChild>
                              <Button variant="outline">Fermer</Button>
                            </DrawerClose>
                          </div>
                        </div>
                      </Form>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Form {...form}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="leftJsonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Premier JSON</FormLabel>
                            <Textarea
                              placeholder='{"example": "value"}'
                              className="min-h-[200px] font-mono"
                              {...field}
                            />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rightJsonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deuxième JSON</FormLabel>
                            <Textarea
                              placeholder='{"example": "modified value"}'
                              className="min-h-[200px] font-mono"
                              {...field}
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      onClick={compareDirectJson}
                      className="mt-4"
                      disabled={isLoading}
                      type="button"
                    >
                      Comparer
                    </Button>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
