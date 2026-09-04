import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Authorized from './views/authorized';
import Unauthorized from './views/unauthorized';
import { ThemeConfig } from './config/theme';
import { SnackbarProvider } from './contexts/snackbarContext';
import { AuthProvider } from './contexts/authContext';
import { ThemeProvider } from './contexts/themeContext';
import { LanguageProvider } from './contexts/languageContext';
import { DialogProvider } from './contexts/dialogContext';

function App() {
  return (
    <div style={{ width: "100%" }}>
      <ThemeProvider>
        <ThemeConfig>
          <SnackbarProvider>
            <DialogProvider>
              <AuthProvider>
                <LanguageProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/auth/*" element={<Authorized />} />
                      <Route path="/*" element={<Unauthorized />} />
                    </Routes>
                  </BrowserRouter>
                </LanguageProvider>
              </AuthProvider>
            </DialogProvider>
          </SnackbarProvider>
        </ThemeConfig>
      </ThemeProvider>
    </div>
  );
}

export default App
