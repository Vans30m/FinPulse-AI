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
import { QueryClient, QueryClientProvider,} from "@tanstack/react-query";

const queryClient =
  new QueryClient();

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