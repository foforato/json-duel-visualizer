
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

// Create the store with proper initialization
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
          ].slice(0, 50), // Limit to 50 entries
        })),
      removeRequest: (id) =>
        set((state) => ({
          savedRequests: state.savedRequests.filter((req) => req.id !== id),
        })),
      clearRequests: () => set({ savedRequests: [] }),
    }),
    {
      name: "json-duel-requests",
      // Add storage configuration with better error handling
      storage: {
        getItem: (name) => {
          // Only run in browser environment
          if (typeof window === 'undefined') return null;
          
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Error retrieving from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          // Only run in browser environment
          if (typeof window === 'undefined') return;
          
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error storing in localStorage:', error);
          }
        },
        removeItem: (name) => {
          // Only run in browser environment
          if (typeof window === 'undefined') return;
          
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);
