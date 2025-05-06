
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreApi, UseBoundStore } from "zustand";

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
  stats?: {
    identical: number;
    differences: number;
    similarity: number;
  };
}

interface RequestState {
  savedRequests: SavedRequest[];
  addRequest: (request: Omit<SavedRequest, "id" | "timestamp">) => void;
  removeRequest: (id: string) => void;
  clearRequests: () => void;
  updateRequestStats: (id: string, stats: { identical: number; differences: number; similarity: number }) => void;
}

// Create the store with proper initialization
export const useRequestStoreBase = create<RequestState>()(
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
      updateRequestStats: (id, stats) =>
        set((state) => ({
          savedRequests: state.savedRequests.map((req) => 
            req.id === id ? { ...req, stats } : req
          ),
        })),
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

// Define the initial state for SSR
const initialState: RequestState = {
  savedRequests: [],
  addRequest: () => {},
  removeRequest: () => {},
  clearRequests: () => {},
  updateRequestStats: () => {}
};

// Create a type for our store
type RequestStore = typeof useRequestStoreBase;

// Server-side rendering safe store
export const useRequestStore = 
  typeof window !== 'undefined' 
    ? useRequestStoreBase 
    : ((() => {
        // Create a function that returns the initialState
        const useStore = () => initialState;
        
        // Add the required properties to make TypeScript happy
        useStore.getState = () => initialState;
        useStore.setState = () => {};
        useStore.subscribe = () => () => {};
        useStore.getInitialState = () => initialState;
        useStore.destroy = () => {};
        useStore.persist = {
          setOptions: () => {},
          clearStorage: () => {},
          rehydrate: () => Promise.resolve(),
          hasHydrated: () => false,
          onHydrate: () => () => {},
          onFinishHydration: () => () => {},
          getOptions: () => ({
            name: "json-duel-requests",
            storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          })
        };
        
        // Cast to unknown first, then to the expected type
        return useStore as unknown as RequestStore;
      })());
