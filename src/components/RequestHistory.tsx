
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
import { Trash, Clock, Database, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

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

  // Use store safely after component has mounted
  useEffect(() => {
    if (ready) {
      // Access store only after component is mounted
      const savedRequests = useRequestStore.getState().savedRequests;
      setRequests(savedRequests);
      
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
      useRequestStore.getState().clearRequests();
    }
  };

  const handleRemoveRequest = (id: string) => {
    if (ready) {
      useRequestStore.getState().removeRequest(id);
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
                    <SidebarMenuItem key={request.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectRequest(request)}
                        tooltip={`${request.request1.url} vs ${request.request2.url}`}
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
