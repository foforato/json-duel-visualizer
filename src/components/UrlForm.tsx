
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

interface UrlFormProps {
  onFetchData: (url1: string, url2: string) => void;
  isLoading: boolean;
}

const UrlForm = ({ onFetchData, isLoading }: UrlFormProps) => {
  const [url1, setUrl1] = useState<string>("");
  const [url2, setUrl2] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchData(url1, url2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="url1" className="text-sm font-medium">
            Premier URL API
          </label>
          <Input
            id="url1"
            value={url1}
            onChange={(e) => setUrl1(e.target.value)}
            placeholder="https://api.exemple.com/v1/endpoint"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="url2" className="text-sm font-medium">
            Deuxième URL API
          </label>
          <Input
            id="url2"
            value={url2}
            onChange={(e) => setUrl2(e.target.value)}
            placeholder="https://api.exemple.com/v2/endpoint"
            required
          />
        </div>
      </div>
      <Button type="submit" className="flex items-center gap-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Comparer
          </>
        )}
      </Button>
    </form>
  );
};

export default UrlForm;
