import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ✨ Import these
import App from './App';
import './index.css';

const queryClient = new QueryClient(); // ✨ Create a QueryClient instance

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> {/* Remove this temporarily */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  // </React.StrictMode>
);