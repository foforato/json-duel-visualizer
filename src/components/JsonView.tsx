
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewProps {
  data: any;
  path?: string[];
  diffMode?: boolean;
  diffData?: any;
  onlyShowDiff?: boolean;
  searchTerm?: string;
  defaultExpanded?: boolean;
  onUpdateDiffCount?: (count: number) => void;
}

const JsonView: React.FC<JsonViewProps> = ({
  data,
  path = [],
  diffMode = false,
  diffData,
  onlyShowDiff = false,
  searchTerm = "",
  defaultExpanded = true,
  onUpdateDiffCount
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const diffCountRef = useRef<number>(0);
  const isRoot = path.length === 0;
  
  // Update expansion state when defaultExpanded changes
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // Handle search and highlighting
  const hasSearchMatch = (value: any): boolean => {
    if (!searchTerm) return false;
    
    if (typeof value === "string") {
      return value.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    }
    return false;
  };
  
  // Report diff count to parent (only from root component)
  useEffect(() => {
    if (isRoot && diffMode && onUpdateDiffCount) {
      onUpdateDiffCount(diffCountRef.current);
    }
  }, [isRoot, diffMode, onUpdateDiffCount, data, diffData]);
  
  // Reset diff counter when component mounts (root only)
  useEffect(() => {
    if (isRoot) {
      diffCountRef.current = 0;
    }
  }, [isRoot]);
  
  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;

  if (typeof data !== "object") {
    const matchesSearch = hasSearchMatch(data);
    
    if (!diffMode) {
      return (
        <span className={cn(
          "break-all", 
          matchesSearch && "bg-yellow-100 px-1 rounded"
        )}>
          {JSON.stringify(data)}
        </span>
      );
    }

    // Check if the value is different in diffData
    const diffValue = path.reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), diffData);
    
    if (diffValue === undefined) {
      // Key exists in this object but not in diff object - it was removed
      if (isRoot) diffCountRef.current++;
      return (
        <span className={cn(
          "break-all bg-removed/10 text-removed-foreground px-1 rounded",
          matchesSearch && "bg-yellow-100"
        )}>
          {JSON.stringify(data)}
        </span>
      );
    } else if (diffValue !== data) {
      // Value is different
      if (isRoot) diffCountRef.current++;
      return (
        <span className={cn(
          "break-all bg-modified/10 text-modified-foreground px-1 rounded",
          matchesSearch && "bg-yellow-100"
        )}>
          {JSON.stringify(data)}
        </span>
      );
    }
    
    return (
      <span className={cn(
        "break-all",
        matchesSearch && "bg-yellow-100 px-1 rounded"
      )}>
        {JSON.stringify(data)}
      </span>
    );
  }

  // For objects and arrays
  const isArray = Array.isArray(data);
  const entries = isArray 
    ? data.map((_, i) => [String(i), data[i]])
    : Object.entries(data);

  // If we're in diff mode and only showing differences, we need to check if this object/array has any differences
  let hasDifferences = false;
  let filteredEntries = entries;
  
  if (diffMode && onlyShowDiff) {
    // Get the corresponding object in diffData
    const currentDiffObj = path.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
      diffData
    );
    
    // If the object doesn't exist in diffData, it was added entirely
    if (currentDiffObj === undefined) {
      hasDifferences = true;
      if (isRoot) diffCountRef.current++;
    } else {
      // Filter entries that have differences
      filteredEntries = entries.filter(([key]) => {
        const childPath = [...path, key];
        const value = data[key];
        const diffValue = childPath.reduce(
          (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
          diffData
        );
        
        // If primitive types
        if (typeof value !== "object" || value === null) {
          const isDifferent = diffValue === undefined || diffValue !== value;
          if (isDifferent) {
            hasDifferences = true;
            if (isRoot) diffCountRef.current++;
          }
          return isDifferent || hasSearchMatch(value);
        }
        
        // If diffValue is undefined, this key doesn't exist in diffData
        if (diffValue === undefined) {
          hasDifferences = true;
          if (isRoot) diffCountRef.current++;
          return true;
        }
        
        // If types don't match (object vs array, etc)
        if (typeof diffValue !== "object" || Array.isArray(value) !== Array.isArray(diffValue)) {
          hasDifferences = true;
          if (isRoot) diffCountRef.current++;
          return true;
        }
        
        // For nested objects/arrays, we need to recursively check
        // This is a simplified check - in a real app you'd want a more thorough comparison
        const valueStr = JSON.stringify(value);
        const diffValueStr = JSON.stringify(diffValue);
        const isDifferent = valueStr !== diffValueStr;
        if (isDifferent) {
          hasDifferences = true;
          if (isRoot) diffCountRef.current++;
        }
        
        // Include in results if different or matches search
        return isDifferent || (searchTerm && valueStr.toLowerCase().includes(searchTerm.toLowerCase()));
      });
      
      // If no differences in this object and no search match, don't render it
      if (filteredEntries.length === 0 && onlyShowDiff) {
        return null;
      }
    }
  } else if (searchTerm) {
    // If we're searching but not filtering by diff, include entries that match the search term
    filteredEntries = entries.filter(([key, value]) => {
      const keyMatch = key.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (typeof value !== "object" || value === null) {
        return keyMatch || hasSearchMatch(value);
      }
      
      // For objects/arrays, we need to check if any child matches
      const valueStr = JSON.stringify(value);
      return keyMatch || valueStr.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    if (filteredEntries.length === 0) {
      return null;
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine if this node should have a diff highlight
  let objectClassName = "";
  if (diffMode && hasDifferences) {
    objectClassName = "border-l-2 pl-1 border-modified-foreground";
  }

  return (
    <div className={`json-diff-view ${objectClassName}`}>
      <div 
        onClick={toggleExpand}
        className="flex items-center cursor-pointer hover:bg-secondary/50 px-1"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 mr-1" />
        ) : (
          <ChevronUp className="h-4 w-4 mr-1" />
        )}
        <span className="font-medium mr-1">
          {isArray ? "[" : "{"}
        </span>
        {!isExpanded && (
          <span className="text-muted-foreground">
            {isArray 
              ? `${data.length} items` 
              : `${Object.keys(data).length} properties`}
          </span>
        )}
        {!isExpanded && <span className="font-medium ml-1">{isArray ? "]" : "}"}</span>}
      </div>

      {isExpanded && (
        <div className="ml-4 border-l-2 pl-2 border-muted">
          {filteredEntries.map(([key, value]) => {
            // Check if this key exists in diffData
            const childPath = [...path, key];
            const keyExistsInDiff = diffMode
              ? childPath.reduce(
                  (obj, k, i) => {
                    if (i === childPath.length - 1) {
                      return obj && k in obj;
                    }
                    return obj && obj[k] !== undefined ? obj[k] : undefined;
                  },
                  diffData
                ) !== undefined
              : true;
                
            // In diffMode and onlyShowDiff, skip entries that don't have differences
            if (diffMode && onlyShowDiff) {
              const currentValue = value;
              const diffValue = childPath.reduce(
                (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
                diffData
              );
              
              // For primitive values
              if (typeof currentValue !== "object" || currentValue === null) {
                if (diffValue !== undefined && diffValue === currentValue && !hasSearchMatch(currentValue)) {
                  return null;
                }
              }
            }
            
            // Determine style for key based on diff status
            let keyClassName = "";
            const keyMatchesSearch = searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (diffMode) {
              if (!keyExistsInDiff) {
                keyClassName = "bg-added/10 text-added-foreground px-1 rounded";
              }
            }
            
            if (keyMatchesSearch) {
              keyClassName = cn(keyClassName, "bg-yellow-100 px-1 rounded");
            }
            
            return (
              <div key={key} className="my-1">
                <div className="flex">
                  <span className={cn("mr-1 font-medium", keyClassName)}>
                    {isArray ? "" : `"${key}":`}
                  </span>
                  <React.Fragment>
                    <JsonView 
                      data={value}
                      path={childPath}
                      diffMode={diffMode}
                      diffData={diffData}
                      onlyShowDiff={onlyShowDiff}
                      searchTerm={searchTerm}
                      defaultExpanded={defaultExpanded}
                    />
                  </React.Fragment>
                </div>
              </div>
            );
          })}
          <div className="font-medium">{isArray ? "]" : "}"}</div>
        </div>
      )}
    </div>
  );
};

export default JsonView;
