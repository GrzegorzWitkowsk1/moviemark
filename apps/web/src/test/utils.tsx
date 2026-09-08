import { type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react";
import { ThemeConfig } from "@/config/theme";
import { ThemeProvider } from "@/contexts/themeContext";
import { SnackbarProvider } from "@/contexts/snackbarContext";
import { DialogProvider } from "@/contexts/dialogContext";
import { LanguageProvider } from "@/contexts/languageContext";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export interface ProvidersOptions {
  queryClient?: QueryClient;
  route?: string;
}

function Providers({
  children,
  queryClient,
  route,
}: ProvidersOptions & { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient ?? createTestQueryClient()}>
      <ThemeProvider>
        <ThemeConfig>
          <SnackbarProvider>
            <DialogProvider>
              <LanguageProvider>
                <MemoryRouter initialEntries={[route ?? "/"]}>
                  {children}
                </MemoryRouter>
              </LanguageProvider>
            </DialogProvider>
          </SnackbarProvider>
        </ThemeConfig>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProvidersOptions & RenderOptions = {}
) {
  const { queryClient, route, ...renderOptions } = options;
  return {
    queryClient,
    ...render(ui, {
      ...renderOptions,
      wrapper: ({ children }) => (
        <Providers queryClient={queryClient} route={route}>
          {children}
        </Providers>
      ),
    }),
  };
}

export function renderHookWithProviders<
  Result,
  Props,
>(renderFn: (initialProps: Props) => Result, options: RenderHookOptions<Props> & ProvidersOptions = {}) {
  const { queryClient, route, ...hookOptions } = options;
  return {
    queryClient,
    ...renderHook(renderFn, {
      ...hookOptions,
      wrapper: ({ children }) => (
        <Providers queryClient={queryClient} route={route}>
          {children}
        </Providers>
      ),
    }),
  };
}