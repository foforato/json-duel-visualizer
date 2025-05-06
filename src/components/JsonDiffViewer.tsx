
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, Copy, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import JsonView from "./JsonView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface JsonDiffViewerProps {
  leftJson: any;
  rightJson: any;
  leftError?: string;
  rightError?: string;
  leftStatus?: number;
  rightStatus?: number;
}

const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({
  leftJson,
  rightJson,
  leftError,
  rightError,
  leftStatus,
  rightStatus
}) => {
  const [onlyShowDiff, setOnlyShowDiff] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandAll, setExpandAll] = useState(true);
  const [diffCount, setDiffCount] = useState<number | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [currentDiffIndex, setCurrentDiffIndex] = useState<number>(0);
  const [diffElements, setDiffElements] = useState<HTMLElement[]>([]);
  
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  
  const [scrolling, setScrolling] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<{
    identical: number;
    differences: number;
    similarity: number;
  }>({
    identical: 0,
    differences: 0,
    similarity: 0
  });
  
  const handleViewModeChange = (value: string) => {
    setViewMode(value as "split" | "unified");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
  };

  const copyToClipboard = useCallback((content: any, side: string) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2))
      .then(() => {
        toast({
          description: `${side} JSON copié dans le presse-papier`,
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Impossible de copier le JSON",
        });
      });
  }, []);

  const updateDiffCount = useCallback((count: number, identicalCount?: number) => {
    setDiffCount(count);
    
    if (identicalCount !== undefined) {
      const total = count + identicalCount;
      const similarity = total > 0 ? Math.round((identicalCount / total) * 100) : 0;
      
      setStats({
        identical: identicalCount,
        differences: count,
        similarity
      });
    }
  }, []);
  
  // Collect all diff elements
  useEffect(() => {
    if (diffCount !== null) {
      // Find all elements with background colors indicating diffs
      const diffNodes = document.querySelectorAll('.bg-modified\\/10, .bg-removed\\/10, .bg-added\\/10');
      setDiffElements(Array.from(diffNodes) as HTMLElement[]);
      
      // Reset current diff index
      setCurrentDiffIndex(0);
    }
  }, [diffCount, viewMode]);
  
  // Navigate to a specific diff element
  const navigateToDiff = useCallback((index: number) => {
    if (!diffElements.length) return;
    
    // Ensure index is within bounds
    const safeIndex = Math.max(0, Math.min(diffElements.length - 1, index));
    setCurrentDiffIndex(safeIndex);
    
    // Scroll to the element
    const element = diffElements[safeIndex];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add a temporary highlight
      element.classList.add('animate-pulse', 'ring-2', 'ring-primary');
      setTimeout(() => {
        element.classList.remove('animate-pulse', 'ring-2', 'ring-primary');
      }, 1500);
    }
  }, [diffElements]);
  
  const goToNextDiff = () => {
    navigateToDiff(currentDiffIndex + 1);
  };
  
  const goToPrevDiff = () => {
    navigateToDiff(currentDiffIndex - 1);
  };
  
  // Synchronized scrolling
  useEffect(() => {
    if (!syncScroll || viewMode !== "split") return;
    
    const handleScroll = (source: string, e: Event) => {
      if (scrolling !== null && scrolling !== source) return;
      
      const sourceEl = e.target as HTMLElement;
      const targetEl = source === 'left' ? rightPanelRef.current : leftPanelRef.current;
      
      if (targetEl && sourceEl) {
        setScrolling(source);
        
        // Calculate scroll percentages
        const sourceScrollMax = sourceEl.scrollHeight - sourceEl.clientHeight;
        const scrollPercent = sourceScrollMax > 0 ? sourceEl.scrollTop / sourceScrollMax : 0;
        
        const targetScrollMax = targetEl.scrollHeight - targetEl.clientHeight;
        const targetScrollPosition = scrollPercent * targetScrollMax;
        
        targetEl.scrollTop = targetScrollPosition;
        
        // Reset scrolling state after a short delay
        setTimeout(() => setScrolling(null), 50);
      }
    };
    
    const leftEl = leftPanelRef.current;
    const rightEl = rightPanelRef.current;
    
    if (leftEl) {
      leftEl.addEventListener('scroll', (e) => handleScroll('left', e));
    }
    
    if (rightEl) {
      rightEl.addEventListener('scroll', (e) => handleScroll('right', e));
    }
    
    return () => {
      leftEl?.removeEventListener('scroll', (e) => handleScroll('left', e));
      rightEl?.removeEventListener('scroll', (e) => handleScroll('right', e));
    };
  }, [syncScroll, viewMode, scrolling]);

  // Helper function to format HTTP status
  const formatStatusCode = (status?: number) => {
    if (!status) return null;
    
    let statusClass = "";
    if (status >= 200 && status < 300) {
      statusClass = "bg-green-100 text-green-800";
    } else if (status >= 400 && status < 500) {
      statusClass = "bg-yellow-100 text-yellow-800";
    } else if (status >= 500) {
      statusClass = "bg-red-100 text-red-800";
    } else {
      statusClass = "bg-gray-100 text-gray-800";
    }
    
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-diff"
              checked={onlyShowDiff}
              onCheckedChange={setOnlyShowDiff}
            />
            <Label htmlFor="show-diff">
              Afficher uniquement les différences
              {diffCount !== null && (
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {diffCount} différence{diffCount !== 1 ? "s" : ""}
                </span>
              )}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="sync-scroll"
              checked={syncScroll}
              onCheckedChange={setSyncScroll}
              disabled={viewMode !== "split"}
            />
            <Label htmlFor="sync-scroll">
              Synchroniser le défilement
            </Label>
          </div>
          
          <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 w-full sm:w-[200px]">
              <TabsTrigger value="split">Côte à côte</TabsTrigger>
              <TabsTrigger value="unified">Unifié</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans le JSON..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={toggleExpandAll}
            >
              {expandAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Réduire tout
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Développer tout
                </>
              )}
            </Button>
            
            {diffCount && diffCount > 0 && (
              <div className="flex gap-1">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={goToPrevDiff}
                  disabled={currentDiffIndex <= 0}
                  title="Différence précédente"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextDiff}
                  disabled={currentDiffIndex >= diffElements.length - 1}
                  title="Différence suivante"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="flex items-center">
                  {currentDiffIndex + 1} / {diffElements.length}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {diffCount !== null && (
        <div className="flex justify-center mb-2">
          <div className="bg-card rounded-lg border p-2 text-sm flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">Similarité :</span>
              <Badge variant={stats.similarity > 75 ? "default" : stats.similarity > 50 ? "outline" : "destructive"}>
                {stats.similarity}%
              </Badge>
            </div>
            <div>
              <span className="font-medium">Identiques :</span> {stats.identical}
            </div>
            <div>
              <span className="font-medium">Différences :</span> {stats.differences}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white border rounded-lg shadow">
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div ref={leftPanelRef} className="p-4 overflow-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  Premier JSON
                  {formatStatusCode(leftStatus)}
                </h3>
                {leftJson && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(leftJson, "Premier")}
                    className="h-8"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                )}
              </div>
              
              {leftError ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{leftError}</div>
              ) : leftJson ? (
                <JsonView
                  data={leftJson}
                  diffMode={true}
                  diffData={rightJson}
                  onlyShowDiff={onlyShowDiff}
                  searchTerm={searchTerm}
                  defaultExpanded={expandAll}
                  onUpdateDiffCount={updateDiffCount}
                />
              ) : (
                <div className="text-muted-foreground">Aucune donnée</div>
              )}
            </div>
            
            <div ref={rightPanelRef} className="p-4 overflow-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  Deuxième JSON
                  {formatStatusCode(rightStatus)}
                </h3>
                {rightJson && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(rightJson, "Deuxième")}
                    className="h-8"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                )}
              </div>
              
              {rightError ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{rightError}</div>
              ) : rightJson ? (
                <JsonView
                  data={rightJson}
                  diffMode={true}
                  diffData={leftJson}
                  onlyShowDiff={onlyShowDiff}
                  searchTerm={searchTerm}
                  defaultExpanded={expandAll}
                />
              ) : (
                <div className="text-muted-foreground">Aucune donnée</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-auto max-h-[70vh]">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium">Vue unifiée</h3>
                <div className="flex items-center gap-2">
                  {formatStatusCode(leftStatus)} → {formatStatusCode(rightStatus)}
                </div>
              </div>
              {leftJson && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(leftJson, "Unifié")}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copier
                </Button>
              )}
            </div>
            {leftJson && rightJson ? (
              <JsonView
                data={leftJson}
                diffMode={true}
                diffData={rightJson}
                onlyShowDiff={onlyShowDiff}
                searchTerm={searchTerm}
                defaultExpanded={expandAll}
                onUpdateDiffCount={updateDiffCount}
              />
            ) : (
              <div className="text-muted-foreground">
                {leftError || rightError || "Aucune donnée à comparer"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonDiffViewer;
