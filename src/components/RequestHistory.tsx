
import React, { useState, useEffect } from "react";
import { useRequestStore, type SavedRequest } from "@/store/requestStore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Trash, Clock, Database, ArrowUpDown, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RequestHistoryProps {
  onSelectRequest: (request: SavedRequest) => void;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ onSelectRequest }) => {
  // Initialize with empty array to avoid hydration mismatch
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "similarity">("newest");
  
  // Only access the store after component is mounted
  useEffect(() => {
    setReady(true);
  }, []);

  // Use store safely after component is mounted
  useEffect(() => {
    if (ready) {
      // Access store only after component is mounted
      const storeState = useRequestStore.getState();
      setRequests(storeState.savedRequests);
      
      // Subscribe to store changes
      const unsubscribe = useRequestStore.subscribe(
        (state) => setRequests([...state.savedRequests])
      );
      
      return () => unsubscribe();
    }
  }, [ready]);

  const handleSelectRequest = (request: SavedRequest) => {
    onSelectRequest(request);
    toast({
      description: "Requête chargée depuis l'historique",
    });
  };

  const handleClearRequests = () => {
    if (ready) {
      const store = useRequestStore.getState();
      if (store && typeof store.clearRequests === 'function') {
        store.clearRequests();
      }
    }
  };

  const handleRemoveRequest = (id: string) => {
    if (ready) {
      const store = useRequestStore.getState();
      if (store && typeof store.removeRequest === 'function') {
        store.removeRequest(id);
      }
    }
  };
  
  // Function to sort requests based on current sort order
  const getSortedRequests = () => {
    if (!requests) return [];
    
    switch (sortOrder) {
      case "oldest":
        return [...requests].sort((a, b) => a.timestamp - b.timestamp);
      case "similarity":
        return [...requests].sort((a, b) => {
          const similarityA = a.stats?.similarity ?? 0;
          const similarityB = b.stats?.similarity ?? 0;
          return similarityB - similarityA; // Higher similarity first
        });
      case "newest":
      default:
        return requests; // Already sorted by newest
    }
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(current => {
      if (current === "newest") return "oldest";
      if (current === "oldest") return "similarity";
      return "newest";
    });
  };
  
  // Get sort label
  const getSortLabel = () => {
    switch (sortOrder) {
      case "oldest": return "Anciennes";
      case "similarity": return "Similarité";
      case "newest": return "Récentes";
    }
  };
  
  // Format similarity badge
  const formatSimilarityBadge = (similarity?: number) => {
    if (similarity === undefined) return null;
    
    let variant: "default" | "outline" | "destructive" = "outline";
    if (similarity > 75) variant = "default";
    if (similarity < 40) variant = "destructive";
    
    return (
      <Badge variant={variant} className="ml-1">
        {similarity}%
      </Badge>
    );
  };

  // Format request details for tooltip/popover
  const formatRequestDetails = (request: SavedRequest) => {
    return (
      <div className="space-y-2 text-xs">
        <div>
          <strong>Requête 1:</strong>
          <div>{request.request1.method} {request.request1.url}</div>
          {request.request1.headers.length > 0 && (
            <div>
              <div className="font-semibold mt-1">En-têtes:</div>
              <ul className="list-disc pl-4">
                {request.request1.headers.map((h, i) => (
                  <li key={i}>{h.key}: {h.value}</li>
                ))}
              </ul>
            </div>
          )}
          {request.leftStatus && <div className="mt-1">Status: {request.leftStatus}</div>}
        </div>
        
        <div>
          <strong>Requête 2:</strong>
          <div>{request.request2.method} {request.request2.url}</div>
          {request.request2.headers.length > 0 && (
            <div>
              <div className="font-semibold mt-1">En-têtes:</div>
              <ul className="list-disc pl-4">
                {request.request2.headers.map((h, i) => (
                  <li key={i}>{h.key}: {h.value}</li>
                ))}
              </ul>
            </div>
          )}
          {request.rightStatus && <div className="mt-1">Status: {request.rightStatus}</div>}
        </div>
      </div>
    );
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold">Historique</h2>
          <div className="flex gap-1">
            {requests.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortOrder}
                className="h-8"
                title={`Trier par : ${getSortLabel()}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            )}
            {requests.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRequests}
                className="h-8"
                title="Effacer l'historique"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tri : {getSortLabel()}</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-150px)]">
              {!ready ? (
                <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                  Chargement...
                </div>
              ) : getSortedRequests().length === 0 ? (
                <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                  Aucune requête sauvegardée
                </div>
              ) : (
                <SidebarMenu>
                  {getSortedRequests().map((request) => (
                    <SidebarMenuItem key={request.id} className="relative">
                      <SidebarMenuButton
                        onClick={() => handleSelectRequest(request)}
                        tooltip={`${request.request1.url} vs ${request.request2.url}`}
                        className="pr-8"
                      >
                        <Database className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <div className="flex items-center">
                            <span className="truncate w-full text-left">{request.name}</span>
                            {formatSimilarityBadge(request.stats?.similarity)}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(request.timestamp), { 
                              addSuffix: true,
                              locale: fr
                            })}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 absolute right-1 top-1/2 -translate-y-1/2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          {formatRequestDetails(request)}
                        </PopoverContent>
                      </Popover>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 absolute right-1 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRequest(request.id);
                        }}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-3 py-2">
          <Badge variant="outline" className="w-full justify-center">
            {requests.length} requête(s)
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RequestHistory;
