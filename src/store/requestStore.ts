
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedRequest {
  id: string;
  name: string;
  timestamp: number;
  request1: {
    url: string;
    method: string;
    headers: { key: string; value: string }[];
    body: string;
  };
  request2: {
    url: string;
    method: string;
    headers: { key: string; value: string }[];
    body: string;
  };
  response1?: any;
  response2?: any;
  leftStatus?: number;
  rightStatus?: number;
}

interface RequestState {
  savedRequests: SavedRequest[];
  addRequest: (request: Omit<SavedRequest, "id" | "timestamp">) => void;
  removeRequest: (id: string) => void;
  clearRequests: () => void;
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set) => ({
      savedRequests: [],
      addRequest: (request) => 
        set((state) => ({
          savedRequests: [
            {
              ...request,
              id: `req_${Date.now()}`,
              timestamp: Date.now(),
            },
            ...state.savedRequests,
          ].slice(0, 50), // Limiter à 50 entrées
        })),
      removeRequest: (id) =>
        set((state) => ({
          savedRequests: state.savedRequests.filter((req) => req.id !== id),
        })),
      clearRequests: () => set({ savedRequests: [] }),
    }),
    {
      name: "json-duel-requests",
    }
  )
);
