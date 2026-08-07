import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AppDataProvider } from "./context/AppDataContext";
import App from './App';
import AuthPage from './features/auth/AuthPage';
import CommandPalette from './components/ui/CommandPalette';
import { ChartProvider } from './context/ChartContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Global client-side caching proxy for GET fetch requests
const fetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // Cache GET requests for 30 seconds

const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const method = init?.method?.toUpperCase() || 'GET';
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  if (method === 'GET' && url.includes('/api/')) {
    const cached = fetchCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data.clone();
    }

    const response = await originalFetch.apply(this, arguments as any);
    if (response.ok) {
      fetchCache.set(url, {
        data: response.clone(),
        timestamp: Date.now()
      });
    }
    return response;
  } else if (method !== 'GET') {
    // Invalidate cache on mutations to ensure fresh data
    fetchCache.clear();
  }
  return originalFetch.apply(this, arguments as any);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Replace with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = "277997199364-tnl0a68ph20tdnnf59pa40q13pc6mmod.apps.googleusercontent.com";

  
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

    <QueryClientProvider
      client={queryClient}
    >

      <BrowserRouter>    
      <ThemeProvider>
        <AppDataProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <ChartProvider>

    <CommandPalette />

    <Routes>
      <Route path="/*" element={<App />} />
      <Route path="/signin" element={<AuthPage />} />
    </Routes>

  </ChartProvider>
</GoogleOAuthProvider>
        </AppDataProvider>
      </ThemeProvider>
        </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>
);