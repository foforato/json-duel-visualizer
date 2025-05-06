
import React from "react";
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
import { Trash, Clock, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface RequestHistoryProps {
  onSelectRequest: (request: SavedRequest) => void;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ onSelectRequest }) => {
  const { savedRequests, removeRequest, clearRequests } = useRequestStore();

  const handleSelectRequest = (request: SavedRequest) => {
    onSelectRequest(request);
    toast({
      description: "Requête chargée depuis l'historique",
    });
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold">Historique</h2>
          {savedRequests.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearRequests();
                toast({
                  description: "Historique effacé",
                });
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Requêtes sauvegardées</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-150px)]">
              {savedRequests.length === 0 ? (
                <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                  Aucune requête sauvegardée
                </div>
              ) : (
                <SidebarMenu>
                  {savedRequests.map((request) => (
                    <SidebarMenuItem key={request.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectRequest(request)}
                        tooltip={`${request.request1.url} vs ${request.request2.url}`}
                      >
                        <Database className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span className="truncate w-full text-left">{request.name}</span>
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
            {savedRequests.length} requête(s)
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RequestHistory;
