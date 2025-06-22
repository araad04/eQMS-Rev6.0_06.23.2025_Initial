import { QueryClient } from '@tanstack/react-query'

// Default query function for React Query
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
  const url = Array.isArray(queryKey) ? String(queryKey[0]) : String(queryKey)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth header for development - check both process.env and import.meta.env
  if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
    headers['X-Auth-Local'] = 'true'
  }

  const response = await fetch(url, { 
    headers,
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      queryFn: defaultQueryFn,
    },
  },
})

// API request utility function
export async function apiRequest(method: string, url: string, body?: any): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth header for development - check both process.env and import.meta.env
  if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
    headers['X-Auth-Local'] = 'true'
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for session management
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  return fetch(url, config)
}

// Export for external use
export const getQueryFn = defaultQueryFn