// src/queryClient.js
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,    // Prevents refetch when tab gains focus
      refetchOnReconnect: false,     // Prevents refetch on network reconnect
      refetchOnMount: false,         // Prevents refetch when component mounts
      staleTime: 60 * 60 * 1000,     // Data stays fresh for 1 hour
      retry: 1                       // Only retry failed queries once
    }
  }
});