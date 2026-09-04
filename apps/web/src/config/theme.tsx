import { useMemo, type ReactNode } from 'react'
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles'

import { CssBaseline } from '@mui/material'
import palette from './palette'
import { useThemeMode } from '@/contexts/themeContext'

type ThemeConfigProps = {
  children: ReactNode
}

export function ThemeConfig({ children }: ThemeConfigProps) {
  const { resolvedMode } = useThemeMode()

  const theme = useMemo(
    () => createTheme({ palette: { mode: resolvedMode, ...palette[resolvedMode] } }),
    [resolvedMode]
  )

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
