import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.css'
import Authorized from './views/authorized';
import Unauthorized from './views/unauthorized';
import { ThemeConfig } from './config/theme';
import { SnackbarProvider } from './contexts/snackbarContext';
import { ThemeProvider } from './contexts/themeContext';
import { LanguageProvider } from './contexts/languageContext';
import { DialogProvider } from './contexts/dialogContext';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <div style={{ width: "100%" }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemeConfig>
            <SnackbarProvider>
              <DialogProvider>
                <LanguageProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/auth/*" element={<Authorized />} />
                      <Route path="/*" element={<Unauthorized />} />
                    </Routes>
                  </BrowserRouter>
                </LanguageProvider>
              </DialogProvider>
            </SnackbarProvider>
          </ThemeConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App
