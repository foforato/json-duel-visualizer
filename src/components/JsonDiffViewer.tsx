
import React, { useState, useCallback } from "react";
import { Search, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import JsonView from "./JsonView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface JsonDiffViewerProps {
  leftJson: any;
  rightJson: any;
  leftError?: string;
  rightError?: string;
}

const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({
  leftJson,
  rightJson,
  leftError,
  rightError
}) => {
  const [onlyShowDiff, setOnlyShowDiff] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandAll, setExpandAll] = useState(true);
  const [diffCount, setDiffCount] = useState<number | null>(null);
  
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

  const updateDiffCount = useCallback((count: number) => {
    setDiffCount(count);
  }, []);

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
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg shadow">
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-4 overflow-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Premier JSON</h3>
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
            
            <div className="p-4 overflow-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Deuxième JSON</h3>
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
              <h3 className="text-sm font-medium">Vue unifiée</h3>
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
