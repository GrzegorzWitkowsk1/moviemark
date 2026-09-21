import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "core";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SnackbarProvider } from "@/contexts/SnackbarContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SnackbarProvider>
              <DialogProvider>{children}</DialogProvider>
            </SnackbarProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
