
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewProps {
  data: any;
  path?: string[];
  diffMode?: boolean;
  diffData?: any;
  onlyShowDiff?: boolean;
}

const JsonView: React.FC<JsonViewProps> = ({
  data,
  path = [],
  diffMode = false,
  diffData,
  onlyShowDiff = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;

  if (typeof data !== "object") {
    if (!diffMode) {
      return <span className="break-all">{JSON.stringify(data)}</span>;
    }

    // Check if the value is different in diffData
    const diffValue = path.reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), diffData);
    
    if (diffValue === undefined) {
      // Key exists in this object but not in diff object - it was removed
      return (
        <span className="break-all bg-removed/10 text-removed-foreground px-1 rounded">
          {JSON.stringify(data)}
        </span>
      );
    } else if (diffValue !== data) {
      // Value is different
      return (
        <span className="break-all bg-modified/10 text-modified-foreground px-1 rounded">
          {JSON.stringify(data)}
        </span>
      );
    }
    
    return <span className="break-all">{JSON.stringify(data)}</span>;
  }

  // For objects and arrays
  const isArray = Array.isArray(data);
  const entries = isArray 
    ? data.map((_, i) => [String(i), data[i]])
    : Object.entries(data);

  // If we're in diff mode and only showing differences, we need to check if this object/array has any differences
  if (diffMode && onlyShowDiff) {
    // Get the corresponding object in diffData
    const currentDiffObj = path.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
      diffData
    );
    
    // If the object doesn't exist in diffData, it was added entirely
    if (currentDiffObj === undefined) {
      // Don't filter anything, the whole object is new
    } else {
      // Filter entries that have differences
      const entriesWithDiff = entries.filter(([key]) => {
        const childPath = [...path, key];
        const value = data[key];
        const diffValue = childPath.reduce(
          (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
          diffData
        );
        
        // If primitive types
        if (typeof value !== "object" || value === null) {
          return diffValue === undefined || diffValue !== value;
        }
        
        // If diffValue is undefined, this key doesn't exist in diffData
        if (diffValue === undefined) return true;
        
        // If types don't match (object vs array, etc)
        if (typeof diffValue !== "object" || Array.isArray(value) !== Array.isArray(diffValue)) {
          return true;
        }
        
        // For nested objects/arrays, we need to recursively check
        // This is a simplified check - in a real app you'd want a more thorough comparison
        return JSON.stringify(value) !== JSON.stringify(diffValue);
      });
      
      // If no differences in this object, don't render it
      if (entriesWithDiff.length === 0) {
        return null;
      }
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="json-diff-view">
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
          {entries.map(([key, value]) => {
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
                if (diffValue !== undefined && diffValue === currentValue) {
                  return null;
                }
              }
            }
            
            // Determine style for key based on diff status
            let keyClassName = "";
            if (diffMode) {
              if (!keyExistsInDiff) {
                keyClassName = "bg-added/10 text-added-foreground px-1 rounded";
              }
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
