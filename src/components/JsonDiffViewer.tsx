
import React, { useState } from "react";
import JsonView from "./JsonView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  const handleViewModeChange = (value: string) => {
    setViewMode(value as "split" | "unified");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-diff"
            checked={onlyShowDiff}
            onCheckedChange={setOnlyShowDiff}
          />
          <Label htmlFor="show-diff">Afficher uniquement les différences</Label>
        </div>
        
        <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-2 w-full sm:w-[200px]">
            <TabsTrigger value="split">Côte à côte</TabsTrigger>
            <TabsTrigger value="unified">Unifié</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="bg-white border rounded-lg shadow">
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-4 overflow-auto max-h-[70vh]">
              <h3 className="text-sm font-medium mb-2">Premier JSON</h3>
              {leftError ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{leftError}</div>
              ) : leftJson ? (
                <JsonView
                  data={leftJson}
                  diffMode={true}
                  diffData={rightJson}
                  onlyShowDiff={onlyShowDiff}
                />
              ) : (
                <div className="text-muted-foreground">Aucune donnée</div>
              )}
            </div>
            
            <div className="p-4 overflow-auto max-h-[70vh]">
              <h3 className="text-sm font-medium mb-2">Deuxième JSON</h3>
              {rightError ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{rightError}</div>
              ) : rightJson ? (
                <JsonView
                  data={rightJson}
                  diffMode={true}
                  diffData={leftJson}
                  onlyShowDiff={onlyShowDiff}
                />
              ) : (
                <div className="text-muted-foreground">Aucune donnée</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-auto max-h-[70vh]">
            <h3 className="text-sm font-medium mb-2">Vue unifiée</h3>
            {leftJson && rightJson ? (
              <JsonView
                data={leftJson}
                diffMode={true}
                diffData={rightJson}
                onlyShowDiff={onlyShowDiff}
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
